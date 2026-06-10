const moment = require("moment-timezone");

module.exports.config = {
    title: "تزكير",
    release: "1.0.3",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "تشغيل أو إيقاف التذكير بأوقات الصلاة",
    section: "الــمـطـور",
    syntax: "تزكير تشغيل / تزكير ايقاف",
    delay: 5
};

const PRAYER_TIMES = {
    "الفجر": "05:00",
    "الظهر": "12:30",
    "العصر": "15:45",
    "المغرب": "18:30",
    "العشاء": "20:00"
};

let sentToday = {};
let reminderInterval = null;

function getNextPrayer(now) {
    const currentMinutes =
        parseInt(now.format("HH")) * 60 +
        parseInt(now.format("mm"));

    let closest = null;

    for (const [name, time] of Object.entries(PRAYER_TIMES)) {
        const [h, m] = time.split(":").map(Number);
        const total = h * 60 + m;

        if (total > currentMinutes) {
            if (!closest || total < closest.total) {
                closest = {
                    name,
                    time,
                    total
                };
            }
        }
    }

    return closest || {
        name: "الفجر",
        time: PRAYER_TIMES["الفجر"]
    };
}

module.exports.run = async function({ api, event, args }) {
    const senderID = event.senderID;
    const threadID = event.threadID;

    const OWNER_IDS = [
        "61559927626036",
        "100051136962291"
    ];

    if (!OWNER_IDS.includes(senderID)) {
        return api.sendMessage(
            "❌ هذا الأمر مخصص للمطور فقط.",
            threadID
        );
    }

    const action = args[0];

    if (!action || !["تشغيل", "ايقاف"].includes(action)) {
        return api.sendMessage(
            "❗ استخدم:\nتزكير تشغيل\nتزكير ايقاف",
            threadID
        );
    }

    if (action === "ايقاف") {
        if (reminderInterval) {
            clearInterval(reminderInterval);
            reminderInterval = null;

            return api.sendMessage(
                "🛑 تم إيقاف التذكير التلقائي.",
                threadID
            );
        }

        return api.sendMessage(
            "⚠️ لا يوجد تذكير يعمل حالياً.",
            threadID
        );
    }

    if (reminderInterval) {
        return api.sendMessage(
            "⚠️ التذكير يعمل بالفعل.",
            threadID
        );
    }

    const now = moment.tz("Africa/Khartoum");
    const nextPrayer = getNextPrayer(now);

    api.sendMessage(
        `✅ تم تشغيل التذكير

🕒 الوقت الحالي: ${now.format("HH:mm")}

🕌 الصلاة القادمة:
${nextPrayer.name} - ${nextPrayer.time}`,
        threadID
    );

    reminderInterval = setInterval(async () => {
        try {
            const now = moment.tz("Africa/Khartoum");
            const currentTime = now.format("HH:mm");
            const today = now.format("YYYY-MM-DD");

            for (const [name, time] of Object.entries(PRAYER_TIMES)) {

                if (
                    currentTime === time &&
                    sentToday[name] !== today
                ) {
                    sentToday[name] = today;

                    const threads = await api.getThreadList(
                        100,
                        null,
                        ["INBOX"]
                    );

                    const groups = threads.filter(
                        thread => thread.isGroup
                    );

                    let count = 0;

                    for (const group of groups) {
                        try {
                            await api.sendMessage(
                                `🕌 حان الآن موعد صلاة ${name}

⏰ حسب توقيت الخرطوم

🤲 تقبل الله منا ومنكم صالح الأعمال.`,
                                group.threadID
                            );

                            count++;

                            await new Promise(resolve =>
                                setTimeout(resolve, 1000)
                            );

                        } catch (e) {
                            console.log(
                                `فشل الإرسال إلى المجموعة ${group.threadID}`
                            );
                        }
                    }

                    console.log(
                        `تم إرسال تذكير ${name} إلى ${count} مجموعة`
                    );
                }
            }

        } catch (err) {
            console.error("خطأ التذكير:", err);
        }
    }, 60000);
};
