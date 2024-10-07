var db = {}
db.cache = {}
if (typeof config.dbKeep === "number") {
setInterval(() => {
    Object.keys(db.cache).forEach(s => {
        Object.keys(db.cache[s]).forEach(k => {
            if (Date.now() > db.cache[s][k].time + config.dbKeep) delete db.cache[s][k]
        })
    })
}, 1000)
}
db.db = new (require('level').Level)(config.dbPath)
db.createSublevel = (sub) => {
    if (db.cache[sub] === undefined) db.cache[sub] = {}
    var sublevel = {}
    sublevel.db = db.db.sublevel(sub)
    sublevel.get = async (name) => {
        try {
            if (db.cache[sub][name] !== undefined) {
		db.cache[sub][name].time = Date.now();
                return JSON.parse(db.cache[sub][name].data)
            } else {
                var data = await sublevel.db.get(name)
                db.cache[sub][name] = {name: name, time: Date.now(), data: data}
                return JSON.parse(data)
            }
        } catch (error) {
            return
        }
    }
    sublevel.put = async (name, data) => {
        db.cache[sub][name] = {name: name, time: Date.now(), data: JSON.stringify(data)}
        await sublevel.db.put(name, JSON.stringify(data))
    }
    sublevel.del = async (name) => {
        delete db.cache[sub][name];
        await sublevel.db.del(name)
    }
    sublevel.clear = async () => {
        db.cache[sub] = {}
        await sublevel.db.clear()
    }
    sublevel.delCache = (name) => {
	delete db.cache[sub][name]
    } 
    return sublevel
}
db.users = db.createSublevel('users');
db.tokens = db.createSublevel('tokens');
db.ips = db.createSublevel('ips');
db.channels = db.createSublevel('channels');
db.chat = db.createSublevel('chat');
db.bans = db.createSublevel('bans');
db.discord = db.createSublevel('discord');
module.exports = db
