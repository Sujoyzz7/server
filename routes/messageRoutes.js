const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getChats } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/chats', protect, getChats);
router.get('/:recipientId', protect, getMessages);

module.exports = router;
