module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
if (!ws.quotas.chat.try()) return;
if (typeof msg.message !== "string") return;
var user = await db.users.get(ws._id);
if (user.mute && (user.mute.permanent || user.mute.ends > Date.now()) && (user.mute.type === "all" || user.mute.type === "chat")) return;
var message = msg.message.split('\n').join('').split('\u200e').join('').substr(0,(config.quotas.length * user.q.length) - 1);
var cha = await channels(ws.channel, {}, '');
if (cha.ch.settings['no cussing'] && !user.bot && user.rank < 2) var message = fun.fun.cussing(message);
var m = {m: "a", a: message, p: user.p, t: Date.now(), id: fun.fun.randomhex(8)};
if (message.trim().length == 0) return
ws.quotas.chat.spend(1)
if (message.startsWith(config.prefix)) {
	ws.sendData({m: "dm", sender: user.p, recipient: {name: "Server", _id: "server", id: "server", color: "#5555ff"}, a: message, t: m.t});
	var say = (mes) => ws.sendData({m: "dm", sender: {name: "Server", _id: "server", id: "server", color: "#5555ff"}, recipient: user.p, a: mes, t: Date.now()});
	var cmd = message.split(' ')[0].slice(config.prefix.length).toLowerCase();
	var args = message.split(' ').slice(1);
	var argss = args.join(' ').trim()
	if (cmd === "reload" && user.rank >= 3) {
		var options = ["process", "complete", "fun", "protocol"];
		if (args.length == 0) return say(`Usage: ${config.prefix}reload <${options.join(', ')}>`);
		if (!options.includes(argss.toLowerCase())) return say(`Invalid option. | Usage: ${config.prefix}reload <${options.join(', ')}>`);
		var opt = argss.toLowerCase();
		if (opt === "fun") {
			fun.load();
			say('Functions reloaded.');
		} else if (opt === "protocol") {
			protocol.load();
			say('Protocol reloaded.')
		} else if (opt === "process" || opt === "complete") {
			say(`Reloading process${opt === 'complete' ? ' and data' : ''}...`);
			fun.fun.ws(a => a.connected, {"m": "notification",title: "Notice", text: "The server is restarting, you will be right back!", duration: 10000});
			setTimeout(() => {
				if (opt === "complete") {
					db.channels.clear();
					db.chat.clear();
					db.bans.clear();
				}
				process.exit()
			},1000)
		}
	} else if (cmd === "help") {
		var cmds = {help: 0, id: 0, reload: 3, setrank: 3, quota: 1, bot: 3, unban: 2, mute: 2, unmute: 2, perms: 1, announce: 3, tag: 3, token: 3, js: 4, kick: 3, info: 1, gentoken: 3, stats: 0};
		var availablecmds = Object.keys(cmds).filter(a => cmds[a] <= user.rank);
		return say(`Commands: ${availablecmds.map(a => config.prefix + a).join(', ')}`)
	} else if (cmd === "muhe") {
		return say('MUHE!!!');
	} else if (cmd === "setrank" && user.rank >= 3) {
		if (args.length == 0) return say(`Usage: ${config.prefix}setrank <ID> <Rank Number> <perms (optional)>`);
		var User = await db.users.get(args[0]);
		if (!User) return say('Invalid ID!');
		var ranknum = Math.floor(Number(args[1]));
		if (isNaN(ranknum)) return say('Invalid Number!');
		if (ranknum >= user.rank) return say('Too high of a rank!');
		if (ranknum < 0 || ranknum > 4) return say('This number is outside of the range 0 to 4!');
		if (User.rank >= user.rank) return say(`You can only manage the ranks of users below you.`);
		User.rank = ranknum
		if (args[2] && args[2].toLowerCase() === "perms") User.r = fun.fun.perms(ranknum);
		await db.users.put(args[0], User);
		say(`Successfully set this users rank${args[2] === 'perms' ? ' and perms' : '' }.`);
	} else if (cmd === "quota" && user.rank >= 1) {
		if (args.length == 0) return say(`Usage: ${config.prefix}quota <ID> (<name> <number>)`);
		if (args.length == 1) {
			var User = await db.users.get(args[0]);
			if (!User) return say('Invalid ID!');
			var diffperms = Object.keys(User.q).filter(q => User.q[q] != 1);
			return say("User's quota: " + diffperms.map(q =>`\`${q}\`: \`${User.q[q]}\``).join(', '))
		} else if (args.length == 3) {
			if (3 > user.rank) return say(`You do not have permission to use this command.`); 
			var User = await db.users.get(args[0]);
			if (!User) return say('Invalid ID!');
			if (User.p._id !== user.p._id && User.rank >= user.rank) return say('This person has a rank too high compared to yours.');
			var num = Number(args[2]);
			if (!isFinite(num) || isNaN(num)) return say('Invalid Number.')
			if (!Object.keys(config.quotas).includes(args[1])) return say(`Invalid Quota.`);
			User.q[args[1]] = num
			if (["mouse", "channel", "chat", "kickban", "channelset", "ls", "custom", "crown"].includes(args[1])) {
				connections.filter(a => a._id === args[0]).forEach(a => {
					a.quotas[args[1]] = fun.fun.quota(config.quotas[args[1]][0] * User.q[args[1]], config.quotas[args[1]][1]);
				})
			} else if (args[1] === "note") {
				connections.filter(a => a._id === args[0] && a.channel).forEach(async a => {
					var c = await channels(a.channel , {} , "");
					a.quotas.note.update({points: num * config.quotas.note * (c.owner() === a._id ? 1.5 : (c.ch.settings.lobby ? 0.2 : 1)), allowance: (num * config.quotas.note * (c.owner() === a._id ? 1.5 : (c.ch.settings.lobby ? 0.2 : 1))) / 3});
					a.sendData({m: "nq", maxHistLen: 3, max: a.quotas.note.max, allowance: a.quotas.note.allowance})
				})
			} else if (args[1] === "userset") {
				userset[args[0]] = fun.fun.quota(config.quotas.userset[0] * num, config.quotas.userset[1])
			}
			await db.users.put(args[0], User)
			say(`Set quota for \`${args[1]}\` to \`${num}\`.`);
		} else return say('Invalid arguments.')
	} else if (cmd === "gentoken" && user.rank >= 3) {
		if (args.length == 0) return say(`Usage: ${config.prefix}gentoken <bot, user>`);
		if (!['bot','user'].includes(argss)) return say('Invalid Arguments.')
		var User = await fun.fun.newuser();
		if (argss.toLowerCase() === "bot") {
			User[0].bot = true
			User[0].p.tag = {text: "BOT", color: "#5555ff"};
		};
	await db.tokens.put(User[0].p._id, User[1]);
	await db.users.put(User[0].p._id, User[0]);
	return say(`Token: ${User[0].p._id}.${User[1]}`)
	} else if (cmd === "bot" && user.rank >= 3) {
		if (args.length == 0) return say(`Usage: ${config.prefix}bot <ID> <Boolean>`);
		var User = await db.users.get(args[0]);
		if (!User) return say('Invalid ID!');
		if (args[1] !== "true" && args[1] !== "false") return say('Invalid Boolean!');
		if (JSON.parse(args[1])) {
			User.bot = true;
		} else delete User.bot
		db.users.put(User.p._id, User);
		return say(`Set this users bot status to \`${args[1]}\``)
	} else if (cmd === "unban" && user.rank >= 2) {
		if (args.length == 0) return say(`Usage: ${config.prefix}unban <ID>`);
		var User = await db.users.get(argss);
		if (!User) return say('Invalid ID!');
		if (User.rank >= user.rank) return say('This person has a rank too high compared to yours.');
		if (!User.ban) return say('This user is not banned!');
		delete User.ban;
		await db.users.put(User.p._id, User);;
		return say('Unbanned.');
	} else if (cmd === "mute" && user.rank >= 2) {
		if (args.length == 0) return say(`Usage: ${config.prefix}mute <ID> <note, chat, all> <time> <reason>`);
		var User = await db.users.get(args[0]);
		if (!User) return say('Invalid ID!');
		if (!['note', 'chat', 'all'].includes(args[1])) return say('Invalid type.');
		if (User.rank >= user.rank) return say('This user has a rank too high compared to yours.');
		var time = NaN;
		if (args[3] === "s") {
			var time = args[2] * 1000;
		}
		if (args[3] === "m") {
			var time = args[2] * 60000;
		}
		if (args[3] === "h") {
			var time = args[2] * 3600000;
		}
		if (args[3] === "d") {
			var time = args[2] * 3600000 * 24;
		}
		if (args[3] === "w") {
			var time = args[2] * 3600000 * 24 * 7;
		}
		if (args[3] === "M") {
			var time = args[2] * 3600000 * 24 * 30;
		}
		if (args[3] === "y") {
			var time = args[2] * 3600000 * 24 * 365;
		}
		var time = Math.floor(time);
		if (args[2] === "f") {
			var time = "f"
		}
		if (time !== "f" && !isFinite(time)) return say('Invalid time.')
		var reasonIndex = 4
		if (time === "f") var reasonIndex = 3;
		var reason = args.slice(reasonIndex).join(' ');
		User.mute = {type: args[1], reason: reason, permanent: time === "f", duration: (time === "f" ? undefined : time), ends: (time === "f" ? undefined : time + Date.now()), _id: ws._id};
		db.users.put(args[0], User);
		return say(`Sucessfully muted.`);
	} else if (cmd === "unmute" && user.rank >= 2) {
                if (args.length == 0) return say(`Usage: ${config.prefix}unmute <ID>`);
                var User = await db.users.get(argss);
                if (!User) return say('Invalid ID!');
                if (User.rank >= user.rank) return say('This person has a rank too high compared to yours.');
                if (!User.mute) return say('This user is not muted!');
                delete User.mute;
                await db.users.put(User.p._id, User);
                return say('Unmuted.');
	} else if (cmd === "info" && user.rank >= 1) {
		if (args.length == 0) return say(`Usage: ${config.prefix}info <ID>`);
		var User = await db.users.get(argss);
		if (!User) return say('Invalid ID!');
		var c = [];
		connections.forEach(a => {
			if (a._id !== User.p._id) return
			if (!a.channel) return
			if (c.includes(a.channel)) return
			c.push(a.channel); 
		})
		say(`ID: \`${User.p._id}\` | Name: \`${User.p.name}\` | Color: \`${User.p.color}\` | Bot: \`${!!User.bot}\` | Rank: \`${User.rank}\`` + (User.p.tag ? ` | Tag Name: \`${User.p.tag.text}\` | Tag Color: \`${User.p.tag.color}\`` : ""));
		say(c.length ? `This user is online in: ${c.join(' -|- ')}` : "This user is offline.");
		if (User.mute && (User.mute.permanent || User.mute.ends > Date.now())) {
			say('This user was muted for ' + (User.mute.permanent ? "forever" : `${fun.fun.mstotime(User.mute.duration)} and ends in ${fun.fun.mstotime(User.mute.ends - Date.now())}`) + ` for \`${User.mute.reason.toString()}\`` + (User.mute.note ? `, Note: \`${User.mute.note.toString()}\`` : ""));
		}
		if (User.ban && (User.ban.permanent || User.ban.ends > Date.now())) {
                        say('This user was banned for ' + (User.ban.permanent ? "forever" : `${fun.fun.mstotime(User.ban.duration)} and ends in ${fun.fun.mstotime(User.ban.ends - Date.now())}`) + ` for \`${User.ban.reason.toString()}\`` + (User.ban.note ? `, Note: \`${User.ban.note.toString()}\`` : ""));
                }
	} else if (cmd === "js" && user.rank >= 4) {
		try {
			var result = await eval(argss);
			if (typeof result === "function") return say("✅=> " + JSON.stringify(result.toString()))
			return say("✅=> " + JSON.stringify(result))
		} catch (error) {
			return say("❎=>" + error.toString())
		}
	} else if (cmd === "perms" && user.rank >= 1) {
		if (args.length == 0) return say(`Usage: ${config.prefix}perms <add, remove, get> <ID> <options>`);
		if (["get", "remove", "add"].includes(args[0])) {
			var User = await db.users.get(args[1]);
			if (!User) return say('Invalid ID.');
			if (args[0] === "get") {
				if (User.r.length == 0) return say(`User's permissions: none`);
				return say(`User's permissions: ` + User.r.map(a => `\`${a}\``).join(', '))
			} else if (args[0] === "add") {
				if (user.rank < 3) return say('Insufficient permissions.');
				if (User.rank >= user.rank) return say('Insufficient permissions.');
				if (!Object.keys(config.permissions).includes(args[2])) return say("Invalid permission.");
				if (User.r.includes(args[2])) return say('Permission already added.');
				User.r.push(args[2]);
				await db.users.put(User.p._id, User);
				return say('Sucessfully added permission.');
			} else if (args[0] === "remove") {
                                if (user.rank < 3) return say('Insufficient permissions.');
                                if (User.rank >= user.rank) return say('Insufficient permissions.');
                                if (!Object.keys(config.permissions).includes(args[2])) return say("Invalid permission.");
                                if (!User.r.includes(args[2])) return say('Permission already removed.');
                                User.r.splice(User.r.indexOf(args[2]), 1);
                                await db.users.put(User.p._id, User);
                                return say('Sucessfully removed permission.');
			} else return say('Invalid arguments.')
		} else return say('Invalid arguments.')

	} else if (cmd === "id") {
		return say(ws._id)
	} else if (cmd === "tag" && (user.rank >= 3 || user.r.includes('tag'))) {
		if (args.length == 0) return say(`Usage: ${config.prefix}tag <set, remove> <ID> <Options>`);
		if (!['set','remove'].includes(args[0])) return say("Invalid Arguments.");
		var User = await db.users.get(args[1]);
		if (!User) return say('Invalid ID.');
		if (User.rank > user.rank) return say('This person has a rank too high compared to yours.');
		
		if (args[0] === "set") {
			if (!fun.fun.validcolor(args[2])) return say('Invalid Color.');
			if (args.length <= 3) return say('Tag Name Required.');
			var newtag = {text: args.slice(3).join(' '), color: args[2]};
			if (User.p.tag && newtag.color === User.p.tag.color && newtag.text === User.p.tag.text) return say('No changes were made.');
		} else if (args[0] === "remove") {
			if (!User.p.tag) return say('No changes were made.');
			var newtag = undefined;
		}
		var rooms = {};
		connections.forEach(a => {
	        if (!a.connected || !a.channel) return;
	        if (!rooms[a.channel]) return rooms[a.channel] = [a._id];
	        if (rooms[a.channel].includes(a._id)) return
	        if (rooms[a.channel]) return rooms[a.channel].push(a._id)
		})
		if (User.p.vanished) var vanu = await fun.fun.vanishperms()
		fun.fun.ws(a => a.connected && a.channel && rooms[a.channel].includes(User.p._id) && (!User.p.vanished || vanu[a._id]), {m: "p", name: User.p.name, color: User.p.color, _id: User.p._id, id: User.p._id, tag: newtag, vanished: User.p.vanished});
		User.p.tag = newtag;
		await db.users.put(args[1], User);
		return say('Successfully Updated Tag.')
	} else if (cmd === "announce" && (user.rank >= 3 || user.r.includes('announce'))) {
		if (args.length == 0) return say(`Usage ${config.prefix}announce <room, global> <text, html> <duration> <target, none> <data>`);
		var notif = {m: "notification", title: "Notice"};
		if (config.announceIds) notif.id = ws._id
		if (!['room', 'global'].includes(args[0])) return say('Invalid Arguments.');
		if (!['text', 'html'].includes(args[1])) return say('Invalid Arguments.');
		notif[args[1]] = args.slice(4).join(' ');
		var dur = Number(args[2])
		if (!isFinite(dur)) return say('Invalid Arguments.');
		notif.duration = dur;
		if(!args[3]) return say('Invalid Arguments.');
		notif.target = args[3]
		if (args[3] === "none") delete notif.target
		var con = connections.filter(a => a.connected)
		if (args[0] === "room") var con = con.filter(a => a.channel === ws.channel);
		fun.fun.ws(con, notif);
	} else if (cmd === "token" && user.rank >= 3) {
		if (args.length == 0) return say(`Usage: ${config.prefix}token <get, reset> <ID>`);
		if (!['get', 'reset'].includes(args[0])) return say('Invalid Arguments.');
		var User = await db.users.get(args[1]);
		if (!User) return say('Invalid ID.');
		if (User.rank >= user.rank) return say('This person has a rank too high compared to yours.');
		if (args[0] === "get") {
			var token = await db.tokens.get(args[1]);
			return say(`Current Token: ${args[1]}.${token}`);
		} else if (args[0] === "reset") {
			var secret = fun.fun.randomhex(96);
			await db.tokens.put(args[1], secret);
			connections.filter(a => a.connected && a._id === args[1]).forEach(a => a.close());
			return say(`New Token: ${args[1]}.${secret}`)
		}
	} else if (cmd === "kick" && user.rank >= 3) {
		if (args.length == 0) return say(`Usage: ${config.prefix}kick <ID>`);
		var User = await db.users.get(argss);
		if (!User) return say('Invalid ID.');
		if (User.rank >= user.rank) return say('This person has a rank too high compared to yours.');
		connections.filter(a => a.connected && a._id === User.p._id).forEach(a => a.close())
	} else if (cmd === "stats") {
		say(`${fun.fun.mem(process.memoryUsage.rss())} |${(config.tick ? (' ' + tick.get() + ' TPS |') : '')} ${connections.length} connections`);
	} else say('This command doesn\'t exist.');
	return;
}
var chat = await db.chat.get(ws.channel) || [];
if (msg.reply_to && chat.find(a => a.id === msg.reply_to /*&& msg._id === a[a.m === "a" ? "p" : "sender"]._id*/)) m.r = msg.reply_to;
fun.fun.ws(a => a.connected && a.channel === ws.channel, m)
chat.push(m);
while (chat.length > 128) chat.splice(0,1);
await db.chat.put(ws.channel, chat)

}
module.exports.name = "a"
