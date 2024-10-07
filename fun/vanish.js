module.exports.run = (ppl, perm) => {
//if (typeof ppl !== "array") return [];
if (perm) return ppl;
return ppl.filter(a => !a.vanished);
}
module.exports.name = "vanish"
