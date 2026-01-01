const express = require('express');
const router = express.Router();
const { getUserProfile, followUser, updateProfile, searchUsers, getUserById, getSuggestedUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchUsers);
router.get('/suggested', protect, getSuggestedUsers);
router.get('/profile/id/:id', protect, getUserById);
router.get('/profile/:username', getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/follow/:id', protect, followUser);

module.exports = router;
