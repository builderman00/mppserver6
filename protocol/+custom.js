module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
ws.subscribed.custom = true;
}
module.exports.name = "+custom"
