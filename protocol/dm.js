module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
if (!ws.quotas.chat.try()) return;
if (typeof msg.message !== "string") return;
var user = await db.users.get(ws._id);
var user2 = await db.users.get(msg._id);
if (!user2) return;
if (user.mute && (user.mute.permanent || user.mute.ends > Date.now()) && (user.mute.type === "all" || user.mute.type === "chat")) return;
var message = msg.message.split('\n').join('').split('\u200e').join('').substr(0,(config.quotas.length * user.q.length) - 1);
var cha = await channels(ws.channel, {}, '');
if (cha.ch.settings['no cussing'] && !user.bot && user.rank < 2) var message = fun.fun.cussing(message);
var m = {m: "dm", a: message, sender: user.p, recipient: user2.p, t: Date.now(), id: fun.fun.randomhex(8)};
if (message.trim().length == 0) return
ws.quotas.chat.spend(1)
var chat = await db.chat.get(ws.channel) || [];
if (msg.reply_to && chat.find(a => a.id === msg.reply_to /*&& msg._id === a[a.m === "a" ? "p" : "sender"]._id*/)) m.r = msg.reply_to;
fun.fun.ws(a => a.connected && a.channel === ws.channel && (a._id === ws._id || a._id === msg._id), m);
chat.push(m);
while (chat.length > 128) chat.splice(0,1);
await db.chat.put(ws.channel, chat)
}
module.exports.name = "dm"
