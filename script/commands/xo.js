const games = {};

module.exports.config = {
title: "xo",
release: "2.0.0",
clearance: 0,
author: "ChatGPT",
summary: "لعبة إكس أوه",
section: "العاب",
syntax: "xo [bot]",
delay: 5
handleEvent: true,
};

const nums = [
"1️⃣","2️⃣","3️⃣",
"4️⃣","5️⃣","6️⃣",
"7️⃣","8️⃣","9️⃣"
];

const wins = [
[0,1,2],[3,4,5],[6,7,8],
[0,3,6],[1,4,7],[2,5,8],
[0,4,8],[2,4,6]
];

module.exports.HakimRun = async function({ api, event, args }) {
const threadID = event.threadID;

if (games[threadID]) {
    return api.sendMessage(
        "⚠️ توجد لعبة جارية بالفعل.",
        threadID
    );
}

if (args[0] === "bot") {

    games[threadID] = {
        mode: "bot",
        board: [...nums],
        player: event.senderID,
        turn: event.senderID
    };

    return api.sendMessage(
        `🤖 لعبة XO ضد البوت

${drawBoard(games[threadID].board)}

أرسل رقم الخانة (1-9)`,
threadID
);
}

games[threadID] = {
    mode: "player",
    board: [...nums],
    player1: event.senderID,
    player2: null,
    turn: null
};

api.sendMessage(
    "🎮 تم إنشاء اللعبة\n\nليدخل لاعب ثانٍ اكتب:\njoinxo",
    threadID
);

};

module.exports.handleEvent = async function({ api, event }) {

const threadID = event.threadID;
const body = event.body;

if (!games[threadID]) return;

const game = games[threadID];

if (
    body?.toLowerCase() === "joinxo" &&
    game.mode === "player" &&
    !game.player2
) {

    if (event.senderID === game.player1) return;

    game.player2 = event.senderID;
    game.turn = game.player1;

    return api.sendMessage(
        `🎮 بدأت اللعبة

${drawBoard(game.board)}

❎ دور اللاعب الأول`,
threadID
);
}

if (!/^[1-9]$/.test(body)) return;

const pos = Number(body) - 1;

if (
    game.board[pos] === "❎" ||
    game.board[pos] === "⭕"
) return;

if (game.mode === "player") {

    if (event.senderID !== game.turn) return;

    const mark =
        event.senderID === game.player1
        ? "❎"
        : "⭕";

    game.board[pos] = mark;

    if (checkWin(game.board, mark)) {

        api.sendMessage(
            `${drawBoard(game.board)}

🏆 فاز ${mark}`,
threadID
);

        delete games[threadID];
        return;
    }

    if (isDraw(game.board)) {

        api.sendMessage(
            `${drawBoard(game.board)}

🤝 تعادل`,
threadID
);

        delete games[threadID];
        return;
    }

    game.turn =
        game.turn === game.player1
        ? game.player2
        : game.player1;

    return api.sendMessage(
        drawBoard(game.board),
        threadID
    );
}

if (game.mode === "bot") {

    if (event.senderID !== game.player) return;

    game.board[pos] = "❎";

    if (checkWin(game.board, "❎")) {

        api.sendMessage(
            `${drawBoard(game.board)}

🏆 لقد فزت!`,
threadID
);

        delete games[threadID];
        return;
    }

    if (isDraw(game.board)) {

        api.sendMessage(
            `${drawBoard(game.board)}

🤝 تعادل`,
threadID
);

        delete games[threadID];
        return;
    }

    const empty = [];

    for (let i = 0; i < 9; i++) {
        if (
            game.board[i] !== "❎" &&
            game.board[i] !== "⭕"
        ) {
            empty.push(i);
        }
    }

    const move =
        empty[Math.floor(Math.random() * empty.length)];

    game.board[move] = "⭕";

    if (checkWin(game.board, "⭕")) {

        api.sendMessage(
            `${drawBoard(game.board)}

🤖 البوت فاز!`,
threadID
);

        delete games[threadID];
        return;
    }

    if (isDraw(game.board)) {

        api.sendMessage(
            `${drawBoard(game.board)}

🤝 تعادل`,
threadID
);

        delete games[threadID];
        return;
    }

    api.sendMessage(
        drawBoard(game.board),
        threadID
    );
}

};

function drawBoard(board) {
return `
${board[0]} | ${board[1]} | ${board[2]}

${board[3]} | ${board[4]} | ${board[5]}

${board[6]} | ${board[7]} | ${board[8]}
`;
}

function checkWin(board, mark) {
return wins.some(
combo =>
combo.every(
i => board[i] === mark
)
);
}

function isDraw(board) {
return board.every(
c => c === "❎" || c === "⭕"
);
      }
