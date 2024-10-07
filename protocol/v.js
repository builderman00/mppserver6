module.exports.run = async (ws, msg) => {
	if (!ws.connected || !ws.channel) return;
	if (typeof msg.vanish !== "boolean") return;
	var user = await db.users.get(ws._id);
	if (!user.r.includes('vanish')) return;
	if (msg.vanish === !!user.p.vanished) return;
		if (msg.vanish) {
			var vanished = true
		} else var vanished = undefined
	var rooms = {};
	connections.forEach(a => {
        	if (!a.connected || !a.channel) return;
        	if (!rooms[a.channel]) return rooms[a.channel] = [a._id];
        	if (rooms[a.channel].includes(a._id)) return
        	if (rooms[a.channel]) return rooms[a.channel].push(a._id)
	});
	var users = {};
	for (var i = 0; i < connections.length; i++) {
		if (connections[i].connected && connections[i].channel && users[connections[i]._id] === undefined) {
			var u = await db.users.get(connections[i]._id);
			users[connections[i]._id] = u.r.includes('vanish');
		}
	}
	user.p.vanished = vanished
	await db.users.put(ws._id, user);
	//var ch = await channels(ws.channel, {}, ws._id);
	connections.filter(a => a.connected && a.channel && rooms[a.channel].includes(ws._id)).forEach(async a => {
		if (users[a._id]) {
			a.sendData({m: "p", name: user.p.name, color: user.p.color, _id: ws._id, id: ws._id, tag: user.p.tag, vanished: vanished})
		} else {
			if (config.p) {
				if (vanished) return a.sendData({m: "bye", p: ws._id});
				return a.sendData({m: "p", name: user.p.name, color: user.p.color, _id: ws._id, id: ws._id, tag: user.p.tag, vanished: vanished, x: 200, y: 200});
			}
			var uch = await channels(a.channel, {}, a._id);
			var um = await uch.msg();
			um.p = a._id
			um.ppl = fun.fun.vanish(um.ppl, false);
			a.sendData(um)
		}
	});
}
module.exports.name = "v"
