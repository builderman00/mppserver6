module.exports.run = (rank) => {
return Object.keys(config.permissions).filter(a => rank >= config.permissions[a])
}
module.exports.name = "perms"
