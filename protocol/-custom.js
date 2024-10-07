module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
ws.subscribed.custom = false;
}
module.exports.name = "-custom"
