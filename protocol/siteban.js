module.exports.run = async (ws, msg) => {
if (typeof msg.id !== "string") return;
if (typeof msg.reason !== "string" || msg.reason.length > 128) return;
if (msg.note && (typeof msg.note !== "string" || msg.note.length > 512)) return;
var user = await db.users.get(ws._id);
if (!user.r.includes('siteBan')) return;
if (!user.r.includes('siteBanAnyReason') && !["Discrimination against others","Discussion of inappropriate topics through chat or names","Sharing or advertising inappropriate content","Discussing self-harm or very negative topics","Spamming the piano in lobbies","Spamming chat in lobbies","Evading site-wide punishments","Evading user's mutes or kickbans","Exploiting bugs","Phishing or IP grabbing","Abusing bots or scripts","Promoting violence or illegal activities","Promoting breaking the rules","Giving out another user's personal information without their consent","Sending similar messages throughout multiple rooms","Spamming the piano throughout multiple rooms to annoy users","Holding the crown in a room that does not belong to you","Abusing permissions or higher quotas","Misleading others through impersonation","Lying about users on the site in a way that negatively affects them"].includes(msg.reason)) return;
var User = await db.users.get(msg.id);
if (!User || User.rank >= user.rank) return;
var ban = {note: msg.note, reason: msg.reason, _id: ws._id}
if (msg.permanent) {
if (!user.r.includes('siteBanAnyDuration')) return;
ban.duration = 0;
ban.permanent = true;
} else {
if (typeof msg.duration !== "number") return;
if (!user.r.includes('siteBanAnyDuration') && 1000 * 60 * 60 * 24 * 30 > msg.duration) return;
ban.duration = msg.duration;
ban.ends = msg.duration + Date.now();
ban.permanent = false;
}
User.ban = ban;
await db.users.put(msg.id, User);
connections.filter(a => a._id === msg.id).forEach(a => a.close())
}
module.exports.name = "siteban"
