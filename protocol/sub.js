module.exports.run = (ws, msg) => {
	if (!config.uws || typeof msg.a !== "string" || typeof msg.t !== "boolean" || !fun.fun.ws.valid.includes(msg.a)) return;
	ws[msg.t ? 'unsubscribe' : 'subscribe'](msg.a);
	if (msg.t) {
		if (connections[msg.a].indexOf(ws) == -1) connections[msg.a].push(ws);
	} else {
		if (connections[msg.a].indexOf(ws) != -1) connections[msg.a].splice(connections[msg.a].indexOf(ws),1);
	}
}
module.exports.name = "sub"
