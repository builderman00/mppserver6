module.exports.run = async () => {
	var users = {};
        for (var i = 0; i < connections.length; i++) {
                if (connections[i].connected && connections[i].channel && users[connections[i]._id] === undefined) {
                        var u = await db.users.get(connections[i]._id);
                        users[connections[i]._id] = u.r.includes('vanish');
                }
        }
	return users
}
module.exports.name = "vanishperms"
