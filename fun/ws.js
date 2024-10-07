module.exports.run = (fil, data) => {
	var str = JSON.stringify(data);
	if (typeof fil === "function") return (config.uws ? connections[data.m] : connections).filter(fil).forEach(a => a.sendData(str));
	fil.forEach(a => a.sendData(str));
}
module.exports.run.__proto__.valid = ["a","dm","b","bye","c","ch","custom","hi","ls","m","n","notification","nq","p","t"];
module.exports.name = "ws"
