module.exports.run = (len) => {
	var output = "";
	for (var i = 0; i < len; i++) output += ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"][Math.floor(Math.random() * 16)]
	return output
}
module.exports.name = "randomhex"
