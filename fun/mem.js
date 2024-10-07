module.exports.run = (num) => {
    if (num >= Math.pow(1024, 3)) {
        return `${(num / Math.pow(1024, 3)).toFixed(1)}GB`;
    } else if (num > Math.pow(1024, 2)) {
        return `${(num / Math.pow(1024, 2)).toFixed(1)}MB`;
    } else if (num > 1024) {
         return `${(num / 1024).toFixed(1)}KB`;
    } else return `${num}B`
}
module.exports.name = "mem";
