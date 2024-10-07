module.exports.run = (setup) => {
var newquota = {max: Math.floor(setup.points), points: Math.floor(setup.points), allowance: Math.floor(setup.allowance)};
newquota.update = (set) => {newquota.max = Math.floor(set.points); newquota.points = Math.floor(set.points); newquota.allowance = Math.floor(set.allowance);}
newquota.try = (num) => {
	if (newquota.points > 0 + (!isNaN(num) ? (num - 1) : 0)) return true;
	return false;
}
newquota.spend = (num) => {
	if (typeof num !== "number") return;
	newquota.points -= Math.floor(num);
	if (newquota.points < 0) newquota.points = 0
}
setInterval(() => {
	if (typeof newquota.allowance === "number") {
		newquota.points += newquota.allowance;
		if (newquota.points > newquota.max) newquota.points = newquota.max
	} else {
		newquota.points = newquota.max
	}
},setup.interval)
return newquota
}
module.exports.name = 'newquota'
