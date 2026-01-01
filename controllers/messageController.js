const Message = require('../models/Message');
const { createNotification } = require('../utils/notificationUtils');

const sendMessage = async (req, res) => {
    const { recipient, text, image } = req.body;
    const chatId = [req.user._id, recipient].sort().join('_');

    try {
        const message = await Message.create({
            chatId,
            sender: req.user._id,
            recipient,
            text,
            image: req.body.image
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username profilePic');

        const io = req.app.get('socketio');
        io.emit(`message-${recipient}`, populatedMessage);

        // Also create a notification for the message
        await createNotification(req, recipient, 'message', null, text);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMessages = async (req, res) => {
    const { recipientId } = req.params;
    const chatId = [req.user._id, recipientId].sort().join('_');

    try {
        const messages = await Message.find({ chatId })
            .sort({ createdAt: 1 })
            .populate('sender', 'username profilePic');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getChats = async (req, res) => {
    try {
        // Find latest message for each chat involving the user
        const messages = await Message.find({
            $or: [{ sender: req.user._id }, { recipient: req.user._id }]
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'username profilePic')
            .populate('recipient', 'username profilePic');

        // Filter to get unique chats
        const chatMap = new Map();
        messages.forEach(msg => {
            if (!chatMap.has(msg.chatId)) {
                chatMap.set(msg.chatId, msg);
            }
        });

        res.json(Array.from(chatMap.values()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendMessage, getMessages, getChats };
