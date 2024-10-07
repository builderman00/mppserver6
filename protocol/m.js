module.exports.run = async (ws, msg) => {
if (!ws.connected || !ws.channel) return;
if (!ws.quotas.mouse.try()) return;
var numx = Number(Number(msg.x).toFixed(2));
var numy = Number(Number(msg.y).toFixed(2));
if (isFinite(numx) && !isNaN(numx)) {
	connections.filter(a => a._id === ws._id && a.channel === ws.channel).forEach(a => {a.x = numx});
	ws.x = numx
} else return
if (isFinite(numy) && !isNaN(numy)) {
	connections.filter(a => a._id === ws._id && a.channel === ws.channel).forEach(a => {a.y = numy});
	ws.y = numy;
} else return
//connections.filter(a => a !== ws && a.channel === ws.channel).forEach(a => a.sendData({m: "m", x: ws.x, y: ws.y, id: ws._id}));
fun.fun.ws(a => a !== ws && a.channel === ws.channel, {m: "m", x: ws.x, y: ws.y, id: ws._id});
ws.quotas.mouse.spend();

}
module.exports.name = "m"
