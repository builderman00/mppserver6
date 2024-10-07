module.exports.run = async (ws, msg) => {
	if (!ws.connected || !ws.channel) return
	var user = await db.users.get(ws._id);
	if (!user.r.includes('clearChat')) return;
	await db.chat.del(ws.channel);
	fun.fun.ws(a => a.connected && a.channel === ws.channel, {m: "c", c: []})
}
module.exports.name = "clearchat"
