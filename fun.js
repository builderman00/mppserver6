var fun = {fun: {}};
fun.load = () => {
fun.fun = {}
fs.readdirSync('fun').filter(f => f.endsWith('.js')).forEach(file => {
try {
var fileName = `./fun/${file}`
var fileData = require(fileName);
delete require.cache[require.resolve(fileName)]
fun.fun[fileData.name] = fileData.run
console.log(`Loaded function ${file}`)
} catch (error) {
console.log(`Failed to load function ${file}: ${error}`)
}
})
}
module.exports = fun
