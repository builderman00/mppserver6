module.exports.run = async (ws, msg) => {
if (!ws.connected) return;
if (typeof msg.name !== "string" || typeof msg._id !== "string") return;
var user = await db.users.get(ws._id);
if (!user.r.includes('usersetOthers')) return;
var User = await db.users.get(msg._id);
if (!User) return;
if (typeof msg.name === "string" && msg.name.length <= 64) {
var newname = msg.name
} else newname = User.p.name
if (User.p.name === newname) return
var rooms = {};
connections.forEach(a => {
        if (!a.connected || !a.channel) return;
        if (!rooms[a.channel]) return rooms[a.channel] = [a._id];
        if (rooms[a.channel].includes(a._id)) return
        if (rooms[a.channel]) return rooms[a.channel].push(a._id)
})
if (User.p.vanished) var vanu = await fun.fun.vanishperms()
fun.fun.ws(a => a.connected && a.channel && rooms[a.channel].includes(msg._id) && (!User.p.vanished || vanu[a._id]), {m: "p", name: newname, color: User.p.color, _id: msg._id, id: msg._id, tag: User.p.tag, vanished: User.p.vanished});
User.p.name = newname;
await db.users.put(msg._id, User)
}
module.exports.name = "setname"
