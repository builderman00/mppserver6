module.exports.run = async (ws, msg) => {
//if (!ws.connected) return;
ws.ping = Date.now();
ws.sendData({m: "t", t: Date.now(), e: msg.e}, true)
}
module.exports.name = "t"
