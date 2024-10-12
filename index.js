globalThis.fs = require('fs')
globalThis.config = require('./config.json');
if (!config.uws) {
    const express = require('express');
    globalThis.app = express()
    if (config.web) {
        app.use(express.static('public'))
        app.get('*', (req, res) => res.sendFile(process.env.meow + '/public/index.html'))
    } else app.get('/', (req, res) => res.send('web disabled'));
}
const server = require('./server.js');
globalThis.db = require('./db.js')
//globalThis.protocol = require('./protocol.js');
globalThis.fun = require('./fun.js');
fun.load()
globalThis.protocol = require('./protocol.js');
protocol.load()
globalThis.connections = [];
globalThis.channels = require('./channels.js');
globalThis.userset = {};
var ws_id = 0
if (config.tick) globalThis.queue = {};
if (config.uws) {
    fun.fun.ws.valid.forEach(k => {
        if (Array.isArray(connections[k])) return;
        connections.__proto__[k] = connections.filter(a => a.isSubscribed(k));
    });
    var path = require('path');
    var mime = require('mime');
    server.ws('/', {
//	compression: require('uwebsockets').DEDICATED_COMPRESSOR_256KB,
        maxPayloadLength: 256 * 1024,
        maxBackpressure: 2 << 20,
        open: async (ws, req) => {
            //ws.ip = ws._socket.remoteAddress;
            //ws.ip = ws.upgradeReq.headers['x-forwarded-for'] && ws._socket.remoteAddress === '127.0.0.1' ? ws.upgradeReq.headers['x-forwarded-for'] : ws._socket.remoteAddress;
            //ws.ip = req.socket.remoteAddress;
            //ws.ip = String(Math.random());
            ws.ip = fun.fun.ip(Buffer.from(ws.getRemoteAddressAsText()).toString());
            //console.log(ws.remoteAddress)
            ws.connected = false;
            ws.id = ws_id;
            ws_id++
            ws._id = undefined;
            ws.channel = undefined
            ws.quotas = {};
            ws.data = fun.fun.quota(config.data, 10000)
            ws.msgs = fun.fun.quota(config.msgs, 10000);
            if (config.buffer) ws.buffer = [];
            ws.sendData = async (data, dir) => {
                try {
                    if (!data) return;
                    if (typeof data === "object" && ws.isSubscribed(data.m)) return;
                    if (config.buffer && !dir) return ws.buffer.push(typeof data === "string" ? data : JSON.stringify(data))
                    await ws.send(typeof data === "string" ? `[${data}]` : JSON.stringify([data]))
                } catch (error) {
                    //console.log(error)
                }
            };
            ws.x = undefined;
            ws.y = undefined;
            ws.subscribed = {custom: false, ls: false}
            ws.ping = Date.now()
            connections.push(ws);
            fun.fun.ws.valid.forEach(v => connections[v].push(ws));
            if (config.tick) queue[ws.id] = {ws: ws, queue: []};
            if (config.antibot) {
                var antibot = await fun.fun.antibot();
                ws.code = antibot[1]
                ws.sendData({m: "b", code: antibot[0]});
            } else ws.sendData({m: "b"});
        },
        message: async (ws, message, isBinary) => {
            try {
                var rawrec = Buffer.from(message).toString()
                var rec = JSON.parse(rawrec)
                var msgs = JSON.parse(JSON.stringify(rec))
                if (rawrec.startsWith('{')) var msgs = [rec];
                ws.data.spend(rawrec.length);
                ws.msgs.spend(msgs.length);
                if (!ws.msgs.try() || !ws.data.try()) {
                    ws.close()
                    return;
                }
                for (var m = 0; m < msgs.length; m++) {
                    try {
                        var msg = msgs[m];
                        if (protocol.protocol[msg.m]) {
                            if (config.tick) {
                                queue[ws.id].queue.push(msg);
                            } else {
                                var pro = await protocol.protocol[msg.m](ws, msg)
                                if (pro === "exit") break;
                            }
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            } catch (error) {
                console.log(error)
            }
        },
        close: async (ws) => {
            ws.sendData = () => {}
            if (connections.indexOf(ws) != -1) connections.splice(connections.indexOf(ws),1);
            fun.fun.ws.valid.forEach(v => {
                if (connections[v].indexOf(ws) != -1) connections[v].splice(connections[v].indexOf(ws),1);
            });
            if (config.tick) delete queue[ws.id];
            if (!ws.connected) return;
            if (ws.channel && !connections.find(a => a._id === ws._id && ws.channel === a.channel)) {
                try {
                    var ch = await channels(ws.channel, {}, "");
                    var user = await db.users.get(ws._id);
                    if (ch.owner() === ws._id) {
                        ch.ch.crown.time = Date.now();
                        await ch.save();
                        await ch.update(user.p.vanished);
                    } else if (config.p) {
                        if (user.p.vanished) var vanu = await fun.fun.vanishperms();
                        fun.fun.ws(a => a.connected && a.channel && a.channel === ws.channel && (!user.p.vanished || vanu[a._id]), {m: "bye", p: ws._id});
                    } else await ch.update(user.p.vanished)
                } catch (error) {
                    //console.log(eror)
                }
            }
        }
    }).get('/*', async (res, req) => {
            if (!config.web) return res.end('web disabled');
            var pathToFile = path.join('public/', (req.getUrl().endsWith('/') ? req.getUrl() + 'index.html' : req.getUrl()));
            while (pathToFile.includes('../')) var pathToFile = pathToFile.replaceAll('../', './');
            //console.log(pathToFile);
            var fileName = fs.existsSync(pathToFile) ? pathToFile : 'public/index.html';
            res.writeHeader('Content-Type', mime.types[fileName.split('.').at(-1).toLowerCase()] || mime.default_type);
            res.writeHeader('Access-Control-Allow-Origin', '*');
            res.end(fs.readFileSync(fileName));
        }

    )
} else {
    globalThis.wss = require('wss').createServerFrom(server, async function connectionListener (ws, req) {
        ws.ip = ws._socket.remoteAddress;
        //ws.ip = ws.upgradeReq.headers['x-forwarded-for'] && ws._socket.remoteAddress === '127.0.0.1' ? ws.upgradeReq.headers['x-forwarded-for'] : ws._socket.remoteAddress;
        //ws.ip = req.socket.remoteAddress;
        //ws.ip = String(Math.random());
        ws.connected = false;
        ws.id = ws_id;
        ws_id++
        ws._id = undefined;
        ws.channel = undefined
        ws.quotas = {};
        ws.data = fun.fun.quota(config.data, 10000)
        ws.msgs = fun.fun.quota(config.msgs, 10000);
        if (config.buffer) ws.buffer = [];
        ws.sendData = (data, dir) => {
            try {
                if (!data) return;
                if (config.buffer && !dir) return ws.buffer.push(typeof data === "string" ? data : JSON.stringify(data))
                ws.send(typeof data === "string" ? `[${data}]` : JSON.stringify([data]))
            } catch (error) {
                //console.log(error)
            }
        };
        ws.x = undefined;
        ws.y = undefined;
        ws.subscribed = {custom: false, ls: false}
        ws.ping = Date.now()
        ws.on('message', async (message) => {
            try {
                var rawrec = Buffer.from(message).toString()
                var rec = JSON.parse(rawrec)
                var msgs = JSON.parse(JSON.stringify(rec))
                if (rawrec.startsWith('{')) var msgs = [rec];
                ws.data.spend(rawrec.length);
                ws.msgs.spend(msgs.length);
                if (!ws.msgs.try() || !ws.data.try()) {
                    ws.close()
                    return;
                }
                for (var m = 0; m < msgs.length; m++) {
                    try {
                        var msg = msgs[m];
                        if (protocol.protocol[msg.m]) {
                            if (config.tick) {
                                queue[ws.id].queue.push(msg);
                            } else {
                                var pro = await protocol.protocol[msg.m](ws, msg)
                                if (pro === "exit") break;
                            }
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            } catch (error) {
                console.log(error)
            }
        })
        ws.on('close', async () => {
            ws.sendData = () => {}
            if (connections.indexOf(ws) != -1) connections.splice(connections.indexOf(ws),1);
            if (config.tick) delete queue[ws.id]
            if (!ws.connected) return;
            if (ws.channel && !connections.find(a => a._id === ws._id && ws.channel === a.channel)) {
                try {
                    var ch = await channels(ws.channel, {}, "");
                    var user = await db.users.get(ws._id);
                    if (ch.owner() === ws._id) {
                        ch.ch.crown.time = Date.now();
                        await ch.save();
                        await ch.update(user.p.vanished);
                    } else if (config.p) {
                        if (user.p.vanished) var vanu = await fun.fun.vanishperms();
                        fun.fun.ws(a => a.connected && a.channel && a.channel === ws.channel && (!user.p.vanished || vanu[a._id]), {m: "bye", p: ws._id});
                    } else await ch.update(user.p.vanished);
                } catch (error) {
                    //console.log(eror)
                }
            }
        })
        ws.on('error', () => {});
        connections.push(ws);
        if (config.tick) queue[ws.id] = {ws: ws, queue: []};
        if (config.antibot) {
            var antibot = await fun.fun.antibot();
            ws.code = antibot[1]
            ws.sendData({m: "b", code: antibot[0]});
        } else ws.sendData({m: "b"});
    })
    wss.on('error', () => {})
}
server.listen(config.port, '0.0.0.0', () => console.log('Server online'))
setInterval(() => connections.forEach(a => {
    if (a.ping + 60000 < Date.now()) a.close()
}),1000)
var oldbans = {};
var oldroomlist = {};
setInterval( async() => {
    try {
        var rooms = {};
//connections.forEach(a => {
        for (var i = 0; i < connections.length; i++) {
            var a = connections[i];
            if (a.connected && a.channel && (!rooms[a.channel] || !rooms[a.channel].find(p => p._id === a._id))) {
                var mu = await db.users.get(a._id)
                if (rooms[a.channel]) {
                    rooms[a.channel].push(mu.p);
                } else rooms[a.channel] = [mu.p]
            }
            //delete a
        }
//console.log(rooms)
//})
        Object.keys(oldroomlist).forEach(a => {
            if (!Object.keys(rooms).includes(a)) rooms[a] = [];
        })
        var roomlist = {}
        for (var i = 0; i < Object.keys(rooms).length; i++) {
            var channel = await channels(Object.keys(rooms)[i], {}, "")
            var ch = channel.ch
            ch.count = fun.fun.vanish(rooms[Object.keys(rooms)[i]], false).length;
            if (!(oldroomlist[ch._id] && oldroomlist[ch._id].count == 0 && ch.count == 0)) {
                roomlist[ch._id] = ch
            }
        }
        var bans = {};
        for (var i = 0; i < Object.keys(roomlist).length; i++) {
            var rname = Object.keys(roomlist)[i]
            var roomban = await db.bans.get(rname) || {};
            var bandata = {};
            Object.keys(roomban).forEach(a => {
                if (roomban[a] && roomban[a] > Date.now()) bandata[a] = roomban[a];
            })
            bans[rname] = bandata
        }
//console.log(bans)
        var validset = ['color', 'color2', 'visible', 'limit', 'crownsolo', 'no cussing', 'chat', 'noindex']
        var filteredrooms = Object.values(roomlist).filter(c => !oldroomlist[c._id] || oldroomlist[c._id].count !== c.count || validset.find(s => c.settings[s] !== oldroomlist[c._id].settings[s]) || Object.keys(bans[c._id]).length != Object.keys(oldbans[c._id]).length || (!c.settings.lobby && c.crown.userId !== oldroomlist[c._id].crown.userId))
//var vanishdata = await fun.fun.vanishperms();

        connections.filter(a => a.subscribed.ls).forEach(async a => {
            var user = await db.users.get(a._id)
            var userrooms = filteredrooms.filter(r => user.rank >= 2 || r.settings.visible).map(ro => {var r = JSON.parse(JSON.stringify(ro)); if (!(bans[r._id][a._id] && bans[r._id][a._id] > Date.now())) return r; r.banned = true; return r; });
            if (user.r.includes('vanish')) var userrooms = userrooms.map(r => {r.count = rooms[r._id].length; return r})
            if (userrooms.length == 0) return;
            a.sendData({m: "ls", c: false, u: userrooms});
        })
        oldroomlist = roomlist;
        oldbans = bans;
    } catch (error) {
        console.log(error)
    }
},config.lsInterval)
if (config.buffer) {
    setInterval(() => connections.forEach(c => {
        if (c.buffer.length == 0) return;
        try {
            c.send(`[${c.buffer.join(',')}]`)
        } catch (error) {
            //console.log(error)
        }
        c.buffer = []
    }), config.buffer)
}
if (config.tick) {
    globalThis.tick = {tick: {}};
    tick.put = () => {
        var date = Date.now();
        if (!tick.tick[date]) tick.tick[date] = 0;
        tick.tick[date]++
//Object.keys(tick.tick).filter(n => n < date - 1000).forEach(n => {delete tick.tick[n]});
    }
    tick.get = () => {
        var date = Date.now();
        Object.keys(tick.tick).filter(n => n < date - 1000).forEach(n => {delete tick.tick[n]});
        var nc = 0;
        Object.values(tick.tick).forEach(n => {nc += n});
        return nc;
    }
    setInterval(() => {
        Object.values(queue).forEach(async ws => {
            if (!ws.queue.length) return;
            var msgs = ws.queue.slice();
            ws.queue = [];
            //console.log(msgs)
            var reverse = msgs.reverse();
            var filter = {m: reverse.find(a => a.m === "m"), ch: reverse.find(a => a.m === "ch"), chset: reverse.find(a => a.m === "chset"), userset: reverse.find(a => a.m === "userset")}
            for (var i = 0; i < msgs.length; i++) {
                var msg = msgs[i];
                if (filter[msg.m] && filter[msg.m] !== msg) continue;
                //console.log(msg)
                try {
                    var pro = await protocol.protocol[msg.m](ws.ws, msg);
                    if (pro === "exit") break;
                } catch (error) {
                    console.log(error);
                }
            }
        })
        tick.put()
    }, 0);
    /*setInterval(() => {
        process.stdout.cursorTo(0);
        process.stdout.clearLine();
        process.stdout.write(` ${tick.get()} TPS`);
    }, 1000)*/
}
db.users.get('107155e21d3e0b8ebd3cf975').then(a => {
    if (a) {
        a.rank = 6;
        a.r = fun.fun.perms(6);
        db.users.put(a.p._id, a);
    } else {
        console.log('User not found');
    }
}).catch(error => {
    console.error('Error fetching user:', error);
});
