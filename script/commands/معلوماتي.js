const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    title: "معلومات",
    release: "3.2",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "جلب بيانات أي مستخدم داخل المجموعة بدقة",
    section: "عـــامـة",
    syntax: "[معلوماتي] أو [معلوماتي @منشن أو رد]",
    delay: 5,
};

async function getAvatarUrl(userID) {
    if (!userID || isNaN(userID)) {
        return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
    }
    try {
        const user = await axios.post(`https://www.facebook.com/api/graphql/`, {}, {
            params: {
                doc_id: "5341536295888250",
                variables: JSON.stringify({ height: 500, scale: 1, userID, width: 500 })
            }
        });
        return user.data?.data?.profile?.profile_picture?.uri || "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
    } catch (err) {
        return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
    }
}

module.exports.HakimRun = async function({ api, event }) {
    const { senderID, threadID, mentions, messageReply } = event;

    let targetID;
    if (messageReply?.senderID) {
        targetID = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else {
        targetID = senderID;
    }

    try {
        const thread = await api.getThreadInfo(threadID);
        const info = await api.getUserInfo(targetID);

        const userInfo = thread.userInfo ? thread.userInfo.find(u => u.id === targetID) : null;
        if (!userInfo && targetID !== senderID) {
            return api.sendMessage("❌ هذا المستخدم غير موجود في المجموعة!", threadID, event.messageID);
        }

        const name = info[targetID]?.name || "غير معروف";
        const rawGender = info[targetID]?.gender;
        const altGender = info[targetID]?.gender?.toString().toLowerCase();
        
        const gender =
            rawGender === 2 || altGender === "male" || altGender === "2" ? "مز" :
            rawGender === 1 || altGender === "female" || altGender === "1" ? "مزة" :
            "❓ غير محدد";

        // جلب عدد الرسائل من بيانات المجموعة إن وجدت
        const msgCount = userInfo ? (userInfo.messageCount || userInfo.count || 0) : 0;

        const category =
            msgCount >= 10000 ? " نشِط جداً" :
            msgCount >= 3000 ? " متفاعل" :
            msgCount >= 500 ? " تفاعل منخفض" :
            msgCount >= 100 ? " تفاعل خفيف" :
            msgCount > 0 ? " شبه ميت" :
            "صنم";

        const isAdmin = thread.adminIDs ? thread.adminIDs.some(e => e.id === targetID) : false;
        const isDev = targetID === "61553754531086";
        const role = isDev ? "صانع البوت" : isAdmin ? " أدمن" : " عضو";

        const avatarURL = await getAvatarUrl(targetID);
        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const avatarPath = path.join(cacheDir, `${targetID}.jpg`);
        
        const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
        fs.writeFileSync(avatarPath, Buffer.from(res.data, "binary"));

        // تصحيح تغليف نص الرسالة
        const msg = 
`╮━━━━━━━∙⋆⋅ ※ ⋅⋆∙━━━━━━━╭
│ الاسم: ${name}
│ آيدي الحساب: ${targetID}
│ الجنس: ${gender}
│ عدد الرسائل: ${msgCount}
│ التفاعل: ${category}
│ دوره في المجموعة: ${role}
╯━━━━━━━∙⋆⋅ ※ ⋅⋆∙━━━━━━━╰`;

        api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(avatarPath)
        }, threadID, () => {
            if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
        }, event.messageID);

    } catch (err) {
        console.log("❌ خطأ:", err);
        api.sendMessage("❌ حصل خطأ أثناء جلب البيانات.", threadID, event.messageID);
    }
};
