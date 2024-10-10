const Level = require('level').Level;

const db = {};
db.cache = {};

// Ensure `config` and `config.dbKeep` are defined
if (typeof config !== 'undefined' && typeof config.dbKeep === 'number') {
    // Set interval to clear expired cache entries
    setInterval(() => {
        Object.keys(db.cache).forEach(sub => {
            Object.keys(db.cache[sub]).forEach(key => {
                if (Date.now() > db.cache[sub][key].time + config.dbKeep) {
                    delete db.cache[sub][key];
                }
            });
        });
    }, 1000);
}

// Initialize Level DB
db.db = new Level(config.dbPath);

// Function to create sublevel with caching
db.createSublevel = (sub) => {
    if (!db.cache[sub]) db.cache[sub] = {};

    const sublevel = {};
    sublevel.db = db.db.sublevel(sub);

    // Get method with caching
    sublevel.get = async (name) => {
        try {
            if (db.cache[sub][name]) {
                // Refresh cache timestamp
                db.cache[sub][name].time = Date.now();
                return JSON.parse(db.cache[sub][name].data);
            } else {
                const data = await sublevel.db.get(name);
                db.cache[sub][name] = { name, time: Date.now(), data };
                return JSON.parse(data);
            }
        } catch (error) {
            // Return undefined if not found or error occurred
            return undefined;
};

// Create sublevels
db.users = db.createSublevel('users');
db.tokens = db.createSublevel('tokens');
db.ips = db.createSublevel('ips');
db.channels = db.createSublevel('channels');
db.chat = db.createSublevel('chat');
db.bans = db.createSublevel('bans');
db.discord = db.createSublevel('discord');

// Export the db object
module.exports = db;
