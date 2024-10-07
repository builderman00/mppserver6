module.exports.run = async (ws, msg) => {
	if (!ws.connected || !ws.channel) return;
	if (!msg.target) return;
	if (msg.data === undefined) return;
	var user = await db.users.get(ws._id);
	if (!ws.quotas.custom.try() || JSON.stringify(msg.data).length > 2048 * user.q.custom) return;
	if (typeof msg.target !== "object") return;
	var sendto = connections.filter(a => a.connected && a.channel && a._id !== ws._id);
	if (msg.target.mode === "subscribed") {
		var sendto = sendto.filter(a => a.subscribed.custom)
	} else if (msg.target.mode === "ids") {
		if (typeof msg.target.ids !== "array") return
		if (msg.target.ids > 32) return
		var sendto = sendto.filter(a => msg.target.ids.filter(b => typeof b === "string").includes(a._id))
	} else if (msg.target.mode === "id") {
		if (typeof msg.target.id !== "string") return
		var sendto = sendto.filter(a => a._id === msg.target.id)
	} else return;
	if (!msg.target.global) var sendto = sendto.filter(a => a.channel === ws.channel)
	fun.fun.ws(sendto, {m: "custom", data: msg.data, p: ws._id});
	ws.quotas.custom.spend(1)
}
module.exports.name = "custom"
