const fs = require('fs');
const path = require('path');

const dbFilePaths = {
    users: path.join('./db/users.json'),
    tokens: path.join('./db/tokens.json'),
    ips: path.join('./db/ips.json'),
    channels: path.join('./db/channels.json'),
    chat: path.join('./db/chat.json'),
    bans: path.join('./db/bans.json'),
    discord: path.join('./db/discord.json'),
};

const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;

const loadDB = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading database from ${filePath}:`, error);
    }
    return {};
};

const saveDB = (data, filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const trimChatFile = () => {
    const filePath = dbFilePaths.chat;
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_CHAT_FILE_SIZE) {
            let chatData = db.data.chat || {};
            const entries = Object.entries(chatData);

            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            while (stats.size > MAX_CHAT_FILE_SIZE && entries.length > 0) {
                const [oldestKey] = entries.shift();
                delete chatData[oldestKey];

                saveDB(chatData, filePath);
                const updatedStats = fs.statSync(filePath);
                stats.size = updatedStats.size;
            }
        }
    }
};

var db = {};
db.cache = {};
db.data = {};

for (const key in dbFilePaths) {
    db.data[key] = loadDB(dbFilePaths[key]);
}

if (typeof config.dbKeep === 'number') {
    setInterval(() => {
        Object.keys(db.cache).forEach((s) => {
            Object.keys(db.cache[s]).forEach((k) => {
                if (Date.now() > db.cache[s][k].time + config.dbKeep) delete db.cache[s][k];
            });
        });
    }, 1000);
}

db.createSublevel = (sub) => {
    if (db.cache[sub] === undefined) db.cache[sub] = {};
    var sublevel = {};

    sublevel.get = async (name) => {
        try {
            if (db.cache[sub][name] !== undefined) {
                db.cache[sub][name].time = Date.now();
                return JSON.parse(db.cache[sub][name].data);
            } else {
                const data = db.data[sub] ? db.data[sub][name] : undefined;
                if (data) {
                    db.cache[sub][name] = { name: name, time: Date.now(), data: data };
                    return JSON.parse(data);
                }
                return undefined;
            }
        } catch (error) {
            console.error(error);
            return undefined;
        }
    };

    sublevel.put = async (name, data) => {
        db.cache[sub][name] = { name: name, time: Date.now(), data: JSON.stringify(data) };

        if (!db.data[sub]) db.data[sub] = {};
        db.data[sub][name] = JSON.stringify(data);
        saveDB(db.data[sub], dbFilePaths[sub]);
        if (sub === 'chat') {
            trimChatFile();
        }
    };

    sublevel.del = async (name) => {
        delete db.cache[sub][name];
        if (db.data[sub]) {
            delete db.data[sub][name];
            saveDB(db.data[sub], dbFilePaths[sub]);
        }
    };

    sublevel.clear = async () => {
        db.cache[sub] = {};
        if (db.data[sub]) {
            delete db.data[sub];
            saveDB({}, dbFilePaths[sub]);
        }
    };

    sublevel.delCache = (name) => {
        delete db.cache[sub][name];
    };

    return sublevel;
};

db.users = db.createSublevel('users');
db.tokens = db.createSublevel('tokens');
db.ips = db.createSublevel('ips');
db.channels = db.createSublevel('channels');
db.chat = db.createSublevel('chat');
db.bans = db.createSublevel('bans');
db.discord = db.createSublevel('discord');

module.exports = db;
