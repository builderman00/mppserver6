module.exports.run = async (ws, msg) => {
if (!ws.connected) return;
ws.subscribed.ls = false;
}
module.exports.name = "-ls"
