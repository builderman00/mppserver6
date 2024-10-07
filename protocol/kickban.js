module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
//console.log(msg)
if (typeof msg.ms !== "number") return;
if (typeof msg._id !== "string") return;
if (!ws.quotas.kickban.try()) return;
var duration = Math.floor(Math.abs(msg.ms));
if (duration > config.maxBan) return
var user = await db.users.get(ws._id);
var ch = await channels(ws.channel, {}, ws._id);
if (!user.r.includes('chownAnywhere') && ch.owner() !== ws._id) return
var User = await db.users.get(msg._id);
if (!User) return;
if (User.rank > user.rank) return ws.sendData({"m":"notification","class":"short","duration":15000,"target":"#room","text":"Unable to ban user.","title":"Notice"});
var bans = await db.bans.get(ws.channel) || {};
bans[User.p._id] = Date.now() + duration;
await db.bans.put(ws.channel, bans);
var chat = await db.chat.get(ws.channel) || [];
var m = {m: "a", a: `Banned ${User.p.name} from the channel for ${Math.floor(duration / 60000)} minutes.`, p: user.p, t: Date.now(), id: fun.fun.randomhex(8)};
fun.fun.ws(a => a.channel === ws.channel, m);
chat.push(m)
while (chat.length > 128) chat.splice(0,1);
await db.chat.put(ws.channel, chat)
var oldchannel = JSON.parse(JSON.stringify(ws.channel));
var banch = await channels(config.bannedChannel, {}, ws._id);
var con = connections.filter(a => a._id === User.p._id && a.channel === ws.channel);
var banuser = connections.find(a => a._id === User.p._id && a.channel === config.bannedChannel);
if (con) {
var roomd = await banch.msg();
roomd.p = User.p._id;
roomd.ppl = fun.fun.vanish(roomd.ppl, User.r.includes('vanish'));
con.forEach(a => {
a.channel = config.bannedChannel;
a.sendData({"m":"notification","class":"short","duration":15000,"target":"#room","text":`${user.p.name} banned you from "${oldchannel}" for ${Math.floor(duration / 60000)} minutes.`,"title":"Notice"});
if (config.p || banuser) a.sendData(roomd);
a.quotas.note.update({points: User.q.note * config.quotas.note * (banch.owner() === a._id ? 1.5 : (banch.ch.settings.lobby ? 0.2 : 1)), allowance: (User.q.note * config.quotas.note * (banch.owner() === a._id ? 1.5 : (banch.ch.settings.lobby ? 0.2 : 1))) / 3});
a.sendData({m: "nq", maxHistLen: 3, max: a.quotas.note.max, allowance: a.quotas.note.allowance})
})
if (!banuser) {
	if (config.p) {
		if (User.p.vanished) var vanu = await fun.fun.vanishperms();
		fun.fun.ws(a => a.connected && a.channel && a.channel === config.bannedChannel && ws._id !== User.p._id && (!User.p.vanished || vanu[a._id]), {m: "p", name: User.p.name, color: User.p.color, _id: User.p._id, id: User.p._id, tag: User.p.tag, vanished: User.p.vanished, x: 200, y: 200});
	} else await banch.update(User.p.vanished)
};
var banchat = await db.chat.get(config.bannedChannel) || []
fun.fun.ws(con, {m: "c", c: banchat.filter(chat => chat.m === "a" || chat.sender._id === msg._id || chat.recipient._id === msg._id).slice(-32)})
if (msg._id === ch.owner()) {
ch.ch.crown.time = Date.now();
await ch.save();
await ch.update();
} else if (config.p) {
if (User.p.vanished) var vanu = await fun.fun.vanishperms();
fun.fun.ws(a => a.connected && a.channel && a.channel === ws.channel && (!User.p.vanished || vanu[a._id]), {m: "bye", p: User.p._id});
} else await ch.update(User.p.vanished);
}
fun.fun.ws(a => a.connected && a.channel === oldchannel, {"m":"notification","class":"short","duration":15000,"target":"#room","text":`${User.p.name} was banned from the channel for ${Math.floor(duration / 60000)} minutes.`,"title":"Notice"});
ws.quotas.kickban.spend(1)
}
module.exports.name = "kickban"
