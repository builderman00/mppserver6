//var channels = {};
//channels.c = {};
var channels = async (name, settings, _id) => {
	var ch = {};
	var channelCache = await db.channels.get(name)
	ch.ch = (channelCache !== undefined) ? (channelCache) : {_id: name, id: name, settings: {lobby: name.startsWith('lobby') || name.startsWith('test/'), color: config.color, color2: config.color2, visible: true, limit: (name.startsWith('lobby') ? 20 : 50), crownsolo: false, "no cussing": false, chat: true, noindex: false}};
	if (!ch.ch.crown && !ch.ch.settings.lobby) {
		ch.ch.crown = {"startPos":{"x":50,"y":0},"endPos":{"x":50,"y":50},"userId":_id ,"participantId":_id,"time":Date.now()}
	}
	if (channelCache === undefined) db.channels.put(name, ch.ch);
	ch.msg = async () => {
		var users = [];
		 connections.filter(a => a.connected && a.channel === ch.ch._id).forEach(a => {
			if (users.includes(a._id)) return;
			users.push(a._id);
		})
		var Users = [];
		for (var i = 0; i < users.length; i++) {
			var u = await db.users.get(users[i]);
			if (u && u.p) {
				var muser = connections.find(a => a._id === u.p._id && a.channel === ch.ch._id)
				u.p.x = (muser && typeof muser.x === "number" && isFinite(muser.x) && !isNaN(muser.x)) ? muser.x : 200;
				u.p.y = (muser && typeof muser.y === "number" && isFinite(muser.y) && !isNaN(muser.y)) ? muser.y : 200;
				Users.push(u.p);
			}
		};
		return {m: "ch", ppl: Users, ch: ch.ch};
		//console.log(Users)
		//connections.filter(a => a.connected && a.channel === ch.ch._id).forEach(a => {
		//	a.sendData({m: "ch", ppl: Users, ch: ch.ch, p: a._id});
		//});
	};
	ch.update = async (van) => {
		var chan = await ch.msg();
		var vanu = await fun.fun.vanishperms();
		(config.uws ? connections.ch : connections).filter(a => a.connected && a.channel === ch.ch._id && (!van || vanu[a._id])).forEach(a => {
			//var c = JSON.parse(JSON.stringify(chan));
			var c = {m: chan.m, ppl: chan.ppl, ch: chan.ch};
			c.p = a._id;
			if (!vanu[a._id]) c.ppl = fun.fun.vanish(c.ppl)
			a.sendData(c);
		})
	}
	ch.owner = () => {
		if (!ch.ch.crown) return "";
		return ch.ch.crown.userId
	};
	ch.save = async () => {
	await db.channels.put(ch.ch._id, ch.ch)
	};
	ch.set = (set) => {
		if (typeof set !== "object") return false;
		oldch = JSON.parse(JSON.stringify(ch.ch.settings))
		var validset = ['color', 'color2', 'visible', 'limit', 'crownsolo', 'no cussing', 'chat', 'noindex'];
		Object.keys(set).forEach(pro => {
			if (!validset.includes(pro)) return;
        		if (pro === "color" && typeof set[pro] === "string" && fun.fun.validcolor(set[pro])) ch.ch.settings.color = set[pro]
        		if (pro === "color2" && typeof set[pro] === "string" && fun.fun.validcolor(set[pro])) ch.ch.settings.color2 = set[pro]
        		if (pro === "visible" && typeof set[pro] === "boolean") ch.ch.settings.visible = set[pro]
        		if (pro === "crownsolo" && typeof set[pro] === "boolean") ch.ch.settings.crownsolo = set[pro]
        		if (pro === "no cussing" && typeof set[pro] === "boolean") ch.ch.settings['no cussing'] = set[pro]
        		if (pro === "chat" && typeof set[pro] === "boolean") ch.ch.settings.chat = set[pro]
        		if (pro === "limit" && !isNaN(Number(set[pro])) && set[pro] < 100 && set[pro] >= 0) ch.ch.settings.limit = Math.floor(Number(set[pro]))
			if (pro === "noindex" && typeof set[pro] === "boolean") ch.ch.settings.noindex = set[pro];
		})
		var changed = false
		validset.forEach(s => {
			if (oldch[s] !== ch.ch.settings[s]) changed = true
		})
		return changed
	}
	return ch
}

module.exports = channels
