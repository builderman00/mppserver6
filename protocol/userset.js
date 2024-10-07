module.exports.run = async (ws, msg) => {
if (!ws.connected) return;
if (!userset[ws._id].try()) return;
var user = await db.users.get(ws._id);
if (typeof msg.set.name === "string" && msg.set.name.length <= 64) {
var newname = msg.set.name
} else newname = user.p.name
if (typeof msg.set.color === "string" && fun.fun.validcolor(msg.set.color)) {
var newcolor = msg.set.color
} else var newcolor = user.p.color
if (user.p.name === newname && user.p.color === newcolor) return
var rooms = {};
connections.forEach(a => {
        if (!a.connected || !a.channel) return;
        if (!rooms[a.channel]) return rooms[a.channel] = [a._id];
        if (rooms[a.channel].includes(a._id)) return
        if (rooms[a.channel]) return rooms[a.channel].push(a._id)
})
	if (user.p.vanished) var vanu = await fun.fun.vanishperms();
fun.fun.ws(a => a.connected && a.channel && rooms[a.channel].includes(ws._id) && (!user.p.vanished || vanu[a._id]), {m: "p", name: newname, color: newcolor, _id: ws._id, id: ws._id, tag: user.p.tag, vanished: user.p.vanished});
user.p.name = newname;
user.p.color = newcolor;
await db.users.put(ws._id, user)
userset[ws._id].spend(1)
}
module.exports.name = "userset"
