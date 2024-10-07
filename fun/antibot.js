var obfuscator = require('javascript-obfuscator');
module.exports.run = async () => {
	var hexcode = fun.fun.randomhex(16);
	var code = `return (() => {if (window && window.location && window.MPP && window.MPP.chat && $ && window.MPP.client/* && $.parseHTML($("body").html())*/) return '${hexcode}'; return '${fun.fun.randomhex(16)}'})()`;
	var o = obfuscator.obfuscate(code, {compact: true}).getObfuscatedCode()
	return [o, hexcode]
	//return [code, hexcode]
}
module.exports.name = "antibot"
