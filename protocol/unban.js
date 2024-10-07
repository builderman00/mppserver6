module.exports.run = async (ws, msg) => {
	if (!ws.connected || !ws.channel) return;
	if (typeof msg._id !== "string") return;
	var user = await db.users.get(ws._id);
	var ch = await channels(ws.channel, {}, ws._id);
	if (!user.r.includes('chownAnywhere') && ch.owner() !== ws._id) return;
	var User = await db.users.get(msg._id);
	if (!User) return;
	var bans = await db.bans.get(ws.channel);
	if (!bans) return;
	if (!bans[msg._id]) return;
	delete bans[msg._id];
	await db.bans.put(ws.channel, bans);
}
module.exports.name = "unban"
