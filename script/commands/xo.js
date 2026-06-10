const games = {};

module.exports.config = {
    title: "xo",
    release: "2.2.0",
    clearance: 0,
    author: "ChatGPT & Hakim",
    summary: "لعبة إكس أوه المطورة بمؤقت إغلاق تلقائي 50 ثانية وأمر إنهاء",
    section: "العاب",
    syntax: "xo [bot] أو xo end",
    delay: 5,
    handleEvent: true
};

const nums = [
    "1️⃣", "2️⃣", "3️⃣",
    "4️⃣", "5️⃣", "6️⃣",
    "7️⃣", "8️⃣", "9️⃣"
];

const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// دالة ذكية لإعادة تعيين المؤقت تلقائيًا
function startTimeout(api, threadID) {
    if (games[threadID] && games[threadID].timeout) {
        clearTimeout(games[threadID].timeout);
    }
    
    games[threadID].timeout = setTimeout(() => {
        if (games[threadID]) {
            api.sendMessage("⏱️ تم إنهاء لعبة XO تلقائيًا بسبب عدم وجود تفاعل لمدة 50 ثانية.", threadID);
            delete games[threadID];
        }
    }, 50 * 1000); // 50 ثانية
}

module.exports.HakimRun = async function({ api, event, args }) {
    const threadID = event.
