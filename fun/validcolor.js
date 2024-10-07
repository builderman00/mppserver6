module.exports.run = (color) => {
if (typeof color !== "string" || color.length != 7 || !color.startsWith('#')) return false;
var real = true
var validhex = "1234567890abcdefABCDEF"
color.substr(1).split('').forEach(cpart => {
if (!validhex.includes(cpart)) real = false
})
return real
}
module.exports.name = "validcolor"
