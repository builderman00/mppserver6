module.exports.run = async (ws, msg) => {
	await ws[config.uws ? "end" : "close"]();
}
module.exports.name = "bye"
