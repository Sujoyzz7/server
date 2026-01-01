const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAsRead);
router.delete('/clear', protect, clearAllNotifications);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
