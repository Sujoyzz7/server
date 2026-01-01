const express = require('express');
const router = express.Router();
const { createStory, getStories } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createStory);
router.get('/', protect, getStories);

module.exports = router;
