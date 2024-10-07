module.exports.run = async (ws, msg) => {
if (!ws.connected) return;
if (!ws.quotas.ls.try()) return
var user = await db.users.get(ws._id)
ws.subscribed.ls = true;
var rooms = {}
for (var i = 0; i < connections.length; i++) {
        var a = connections[i];
        if (a.connected && a.channel && (!rooms[a.channel] || !rooms[a.channel].find(p => p._id === a._id))) {
                var mu = await db.users.get(a._id)
                if (rooms[a.channel]) {
                        rooms[a.channel].push(mu.p);
                } else rooms[a.channel] = [mu.p]
        }
        //delete a
}
//console.log(i)
//console.log(rooms)
var roomlist = []
for (var i = 0; i < Object.keys(rooms).length; i++) {
var channel = await channels(Object.keys(rooms)[i], {}, "")
var ch = channel.ch
ch.count = fun.fun.vanish(rooms[Object.keys(rooms)[i]], user.r.includes('vanish')).length;
roomlist.push(ch);
}
var bans = {};
for (var i = 0; i < roomlist.length; i++) {
bans[roomlist[i]._id] = await db.bans.get(roomlist[i]._id) || {};
}
ws.sendData({m: "ls", c: true, u: roomlist.filter(r => user.rank >= 2 || r.settings.visible).map(ro => {var r = JSON.parse(JSON.stringify(ro)); if (!(bans[r._id][ws._id] && bans[r._id][ws._id] > Date.now())) return r; r.banned = true; return r; })})
ws.quotas.ls.spend(1)
}
module.exports.name = "+ls"
