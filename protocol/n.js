module.exports.run = async (ws, msg) => {
	if (!ws.connected || !ws.channel) return;
	if (!ws.quotas.note.try(msg.n.length)) return
	var user = await db.users.get(ws._id);
	if (!user.r.includes('noteMessageBypass') && !ws.note.try()) return;
	if (user.mute && (user.mute.permanent || user.mute.ends > Date.now()) && (user.mute.type === "all" || user.mute.type === "note")) return;
	var ch = await channels(ws.channel, {}, ws._id);
	if (ch.ch.settings.crownsolo && !user.r.includes('playNotesAnywhere')) return;
	var keys = ["a-1","as-1","b-1","c0","cs0","d0","ds0","e0","f0","fs0","g0","gs0","a0","as0","b0","c1","cs1","d1","ds1","e1","f1","fs1","g1","gs1","a1","as1","b1","c2","cs2","d2","ds2","e2","f2","fs2","g2","gs2","a2","as2","b2","c3","cs3","d3","ds3","e3","f3","fs3","g3","gs3","a3","as3","b3","c4","cs4","d4","ds4","e4","f4","fs4","g4","gs4","a4","as4","b4","c5","cs5","d5","ds5","e5","f5","fs5","g5","gs5","a5","as5","b5","c6","cs6","d6","ds6","e6","f6","fs6","g6","gs6","a6","as6","b6","c7"];
	if (msg.n.length == 0) return;
	var currentNotes = [];
	msg.n.forEach(note => {
	try {
		if (note.s != 1) {
			if (note.v > 1 || note.v <= 0) return;
		}
		if (!keys.includes(note.n)) return;
		if (note.d) {
			if (typeof note.d !== "number") note.d = 0
			if (Math.abs(note.d) > 200) note.d = 200

			}
		currentNotes.push({n: note.n, v: note.v, s: note.s, d: Math.floor(note.d ? note.d : 0)})
	} catch (error) {
		//j
	}
})
if (currentNotes.length == 0) return;
if (!ws.quotas.note.try(currentNotes.length)) return;
fun.fun.ws(a => a.channel === ws.channel && a._id !== ws._id, {m: "n", n: currentNotes, t: msg.t, p: ws._id});
ws.note.spend(1)
ws.quotas.note.spend(currentNotes.length)
delete currentNotes
}
module.exports.name = "n"
