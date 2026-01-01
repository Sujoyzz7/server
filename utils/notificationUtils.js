const Notification = require('../models/Notification');

const createNotification = async (req, recipient, type, post = null, text = '') => {
    if (recipient.toString() === req.user._id.toString()) return;

    try {
        // Prevent duplicate follow notifications (debounce/check recent)
        if (type === 'follow') {
            const lastNotif = await Notification.findOne({
                recipient,
                sender: req.user._id,
                type: 'follow'
            }).sort({ createdAt: -1 });

            // If a follow notification exists from the same person, don't create a new one
            // This prevents spamming if someone unfollows and refollows repeatedly
            if (lastNotif) return;
        }

        const notification = await Notification.create({
            recipient,
            sender: req.user._id,
            type,
            post,
            text
        });

        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'username profilePic')
            .populate('post', 'content image');

        const io = req.app.get('socketio');
        io.emit(`notification-${recipient}`, populatedNotification);

        return populatedNotification;
    } catch (error) {
        console.error('Notification creation failed:', error);
    }
};

module.exports = { createNotification };
