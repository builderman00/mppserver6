var protocol = {protocol: {}};
protocol.load = () => {
protocol.protocol = {}
fs.readdirSync('protocol').filter(f => f.endsWith('.js')).forEach(file => {
try {
var fileName = `./protocol/${file}`
var fileData = require(fileName);
delete require.cache[require.resolve(fileName)]
protocol.protocol[fileData.name] = fileData.run
console.log(`Loaded protocol ${file}`)
} catch (error) {
console.log(`Failed to load protocol ${file}: ${error}`)
}
})
}
module.exports = protocol
