module.exports.run = (time) => {
    if (time >= 10000000000000) {
        return 'forever';
    }
    if (time >= 31536000000) {
        return Math.round((time / 31536000000) * 10) / 10 + ' years';
    }
    if (time >= 2592000000) {
        return Math.round((time / 2592000000) * 10) / 10 + ' months';
    }
    if (time >= 604800000) {
        return Math.round((time / 604800000) * 10) / 10 + ' weeks';
    }
    if (time >= 86400000) {
        return Math.round((time / 86400000) * 10) / 10 + ' days';
    }
    if (time >= 3600000) {
        return Math.round((time / 3600000) * 10) / 10 + ' hours';
    }
    if (time >= 60000) {
        return Math.round((time / 60000) * 10) / 10 + ' minutes';
    }
    if (time >= 1000) {
        return Math.round((time / 1000) * 10) / 10 + ' seconds';
    }
    return time + ' milliseconds';

}
module.exports.name = "mstotime"
