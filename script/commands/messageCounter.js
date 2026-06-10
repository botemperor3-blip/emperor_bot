const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "cache", "messageCount.json");

if (!fs.existsSync(dataPath)) {
    fs.writeJsonSync(dataPath, {});
}

module.exports.config = {
    title: "messageCounter",
    release: "1.0.0",
    clearance: 2,
    author: "ChatGPT",
    summary: "عداد الرسائل",
    section: "system",
    syntax: "",
    delay: 0
};

module.exports.handleEvent = async function({ event }) {
    if (!event.senderID || !event.body) return;

    const data = fs.readJsonSync(dataPath);

    data[event.senderID] = (data[event.senderID] || 0) + 1;

    fs.writeJsonSync(dataPath, data);
};

module.exports.HakimRun = async function() {};
