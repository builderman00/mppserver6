module.exports.get = (type) => module.exports.data[type] || 'application/octet-stream';
module.exports.data = {};
Object.entries(require('mime-db')).forEach(ent => {
	if (!ent[1].extensions) return;
	ent[1].extensions.forEach(ext => {
		module.exports.data[ext] = ent[0];
	})
})


