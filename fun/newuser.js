module.exports.run = () => {
var newUser = [];
var User = {rank: 0, r: [], q: {}, p: {name: "Anonymous", color: "#" + fun.fun.randomhex(6)}, bot: false};
Object.keys(config.quotas).forEach(a => User.q[a] = 1);
var _Id = fun.fun.randomhex(24)
User.p._id = _Id;
User.p.id = _Id;
//User.p.vanished = false;
//user.p.tag = undefined
newUser.push(User);
newUser.push(fun.fun.randomhex(96))
return newUser
}
module.exports.name = "newuser"
