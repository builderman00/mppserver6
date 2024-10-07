module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
if (!ws.quotas.channelset.try()) return;
var user = await db.users.get(ws._id);
var ch = await channels(ws.channel, {}, ws._id);
if (ch.owner() !== ws._id && !user.r.includes('chsetAnywhere')) return;
var changed = await ch.set(msg.set);
if (!changed) return;
await ch.save();
await ch.update();
ws.quotas.channelset.spend(1)
}
module.exports.name = "chset"
