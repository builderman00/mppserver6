module.exports.run = async (ws, msg) => {
    // Ensure WebSocket is connected and the channel exists
    if (!ws.connected || !ws.channel) return;

    // Ensure the user has sufficient chat quota
    if (!ws.quotas.chat.try()) return;

    // Validate the message
    if (typeof msg.message !== "string") return;

    // Fetch sender and recipient from the database
    const user = await db.users.get(ws._id);
    const user2 = await db.users.get(msg._id);
    if (!user2) return; // If recipient doesn't exist, abort

    // Check if the sender is muted (all/chat), and handle mute expiration
    if (user.mute && (user.mute.permanent || user.mute.ends > Date.now()) &&
        (user.mute.type === "all" || user.mute.type === "chat")) return;

    // Clean and truncate the message based on quota and length restrictions
    const message = msg.message.split('\n').join('')
                              .split('\u200e').join('')
                              .substr(0, (config.quotas.length * user.q.length) - 1);

    // Fetch the channel settings
    const cha = await channels(ws.channel, {}, '');

    // Apply profanity filter if necessary (based on channel settings and user rank)
    if (cha.ch.settings['no cussing'] && !user.bot && user.rank < 2) {
        message = fun.fun.cussing(message);
    }

    // If the message is empty after trimming, abort
    if (message.trim().length === 0) return;

    // Create the message object to be sent
    const m = {
        m: "dm", 
        a: message, 
        sender: user.p, 
        recipient: user2.p, 
        t: Date.now(), 
        id: fun.fun.randomhex(8)
    };

    // Deduct the chat quota
    ws.quotas.chat.spend(1);

    // Fetch the chat history of the current channel (or initialize if empty)
    let chat = await db.chat.get(ws.channel) || [];

    // Handle reply-to functionality if it's a response to a previous message
    if (msg.reply_to && chat.find(a => a.id === msg.reply_to && msg._id === (a.m === "a" ? a.p : a.sender)._id)) {
        m.r = msg.reply_to; // Add reply-to ID
    }

    // Broadcast the message to all connected users in the same channel
    fun.fun.ws(
        a => a.connected && a.channel === ws.channel && 
             (a._id === ws._id || a._id === msg._id), m
    );

    // Append the new message to the chat log
    chat.push(m);

    // Ensure chat history does not exceed 128 messages (FIFO)
    while (chat.length > 128) {
        chat.shift(); // Remove the oldest message
    }

    // Update the chat log in the database
    await db.chat.put(ws.channel, chat);
};

module.exports.name = "dm";
