module.exports.run = async (ws, msg) => {
//console.log(msg)
if (!ws.connected) return;
if (!ws.quotas.channel.try()) return;
if (!msg._id) return;
if (typeof msg._id !== "string" || msg._id.trim().length == 0 || msg._id.length > 512) return;
if (msg._id === ws.channel) return;
var user = await db.users.get(ws._id)
var bans = await db.bans.get(msg._id) || {};
if (bans[ws._id]) {
if (Date.now() > bans[ws._id]) {
delete bans[ws._id];
await db.bans.put(msg._id, bans)
var channelName = msg._id
} else {
ws.sendData({"m":"notification","class":"short","duration":15000,"target":"#room","text":`You are currently banned from "${msg._id}" for ${Math.floor((bans[ws._id] - Date.now()) / 60000)} minutes.`,"title":"Notice"});
if (!ws.channel) {
var channelName = config.bannedChannel;
} else return;
}
} else var channelName = msg._id;
var newName = channelName
var full = false
var channelPart = 0
for (;;) {
var users = [];
//var chraw = await db.channels.get(newName) || {settings: {limit: (newName.startsWith('lobby') ? 20 : 50)}};
var chraw = await channels(newName, {}, ws._id);
connections.forEach(a => {
if (!a.connected || !a.channel) return;
if (a.channel !== newName) return;
if (users.includes(a._id)) return;
users.push(a._id)
})
//if (users.length >= chraw.settings.limit && (chraw.crown && chraw.crown.userId !== ws._id) && !users.includes(ws._id) && user.rank < 1) {
if (users.length >= chraw.ch.settings.limit && chraw.owner() !== ws._id && !users.includes(ws._id) && user.rank < 1) {
//console.log('full')
var full = true;
channelPart++
newName = `lobby${channelPart == 1 ? '' : channelPart }`;
} else {
//console.log('not full')
break
};
}
if (full) {
ws.sendData({"m":"notification","class":"short","duration":15000,"target":"#room","text":"That room is currently full.","title":"Notice"})
if (ws.channel) {
return
} else {
channelName = newName
}
}
if (channelName === ws.channel) return;
if (ws.channel) var oldch = await channels(ws.channel, {}, ws._id)
ws.channel = channelName
if (oldch && !connections.find(a => a.channel === oldch.ch._id && a._id === ws._id && a.id !== ws.id)) {
	if (oldch.owner() === ws._id) {
		oldch.ch.crown.time = Date.now();
		await oldch.save();
		await oldch.update(user.p.vanished);
	} else if (config.p) {
		if (user.p.vanished) var vanu = await fun.fun.vanishperms();
		fun.fun.ws(a => a.connected && a.channel && a.channel === oldch.ch._id && (!user.p.vanished || vanu[a._id]), {m: "bye", p: ws._id});
	} else await oldch.update(user.p.vanished);
}
//if (oldch) await oldch.update()
var c = await channels(channelName, {}, ws._id);
var change = false
if (c.owner() === ws._id) var change = c.set(msg.set);
if (change) await c.save();
if (connections.filter(a => a.connected && a.channel === ws.channel && a._id === ws._id).length > 1) {
var chan = await c.msg();
chan.p = ws._id;
chan.ppl = fun.fun.vanish(chan.ppl, user.r.includes('vanish'))
ws.sendData(chan)
} else if (config.p && c.owner() !== ws._id) {
	if (user.p.vanished) var vanu = await fun.fun.vanishperms();
	fun.fun.ws(a => a.connected && a.channel && a.channel === ws.channel && a._id !== ws._id && (!user.p.vanished || vanu[a._id]), {m: "p", name: user.p.name, color: user.p.color, _id: ws._id, id: ws._id, tag: user.p.tag, vanished: user.p.vanished, x: 200, y: 200});
	var chan = await c.msg();
	chan.p = ws._id;
	chan.ppl = fun.fun.vanish(chan.ppl, user.r.includes('vanish'));
	ws.sendData(chan)
} else await c.update(user.p.vanished);
var chat = await db.chat.get(channelName) || [];
ws.sendData({m: "c", c: chat.filter(a => a.m === "a" || a.sender._id === ws._id || a.recipient._id === ws._id).slice(-32)});
ws.quotas.channel.spend(1)
var user = await db.users.get(ws._id);
ws.quotas.note.update({points: user.q.note * config.quotas.note * (c.owner() === ws._id ? 1.5 : (c.ch.settings.lobby ? 0.2 : 1)), allowance: (user.q.note * config.quotas.note * (c.owner() === ws._id ? 1.5 : (c.ch.settings.lobby ? 0.2 : 1))) / 3});
ws.sendData({m: "nq", maxHistLen: 3, max: ws.quotas.note.max, allowance: ws.quotas.note.allowance})
}
module.exports.name = "ch"
