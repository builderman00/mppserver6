module.exports.run = async (ws, msg) => {
if (!ws.connected) return;
if (typeof msg.color !== "string" || typeof msg._id !== "string") return;
var user = await db.users.get(ws._id);
if (!user.r.includes('usersetOthers')) return;
var User = await db.users.get(msg._id);
if (!User) return;
if (typeof msg.color === "string" && fun.fun.validcolor(msg.color)) {
var newcolor = msg.color
} else var newcolor = User.p.color
if (User.p.color === newcolor) return
var rooms = {};
connections.forEach(a => {
        if (!a.connected || !a.channel) return;
        if (!rooms[a.channel]) return rooms[a.channel] = [a._id];
        if (rooms[a.channel].includes(a._id)) return
        if (rooms[a.channel]) return rooms[a.channel].push(a._id)
})
if (User.p.vanished) var vanu = await fun.fun.vanishperms()
fun.fun.ws(a => a.connected && a.channel && rooms[a.channel].includes(msg._id) && (!User.p.vanished || vanu[a._id]), {m: "p", name: User.p.name, color: newcolor, _id: msg._id, id: msg._id, tag: User.p.tag, vanished: User.p.vanished});
User.p.color = newcolor;
await db.users.put(msg._id, User)
}
module.exports.name = "setcolor"
