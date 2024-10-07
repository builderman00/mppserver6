module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
//if (typeof msg.id !== "string") return;
if (!ws.quotas.crown.try()) return;
//console.log(msg)
if (!!connections.find(a => a.connected && a._id === msg.id)) {
	var crownId = msg.id;
} else var crownId = "";
//console.log(crownId)
var ch = await channels(ws.channel, {}, ws._id);
var user = await db.users.get(ws._id);
if (ch.ch.settings.lobby) return;
if (ch.owner() === crownId) return;
if (!user.r.includes('chownAnywhere') && !(/*connections.find(a => a.connected && a.channel === ws.channel && a._id === crownId) ?*/ (ch.owner() === ws._id ) || (!connections.find(a => a.connected && a.channel === ws.channel && a._id === ch.owner()) && ch.ch.crown.time + 15000 < Date.now() ) )) return ws.quotas.crown.spend(1);
var oldowner = ch.owner();
ch.ch.crown.time = Date.now();
ch.ch.crown.userId = crownId;
ch.ch.crown.participantId = crownId;
await ch.save();
await ch.update();
connections.filter(a => a.channel === ws.channel && (ws._id === oldowner || ws._id === crownId)).forEach(async (a) => {
var u = await db.users.get(a._id)
a.quotas.note.update({points: u.q.note * config.quotas.note * (ch.owner() === a._id ? 1.5 : (ch.ch.settings.lobby ? 0.2 : 1)), allowance: (u.q.note * config.quotas.note * (ch.owner() === a._id ? 1.5 : (ch.ch.settings.lobby ? 0.2 : 1))) / 3});
a.sendData({m: "nq", maxHistLen: 3, max: a.quotas.note.max, allowance: a.quotas.note.allowance})
})
ws.quotas.crown.spend(1);
}
module.exports.name = "chown"
