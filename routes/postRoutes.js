const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, addComment, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createPost)
    .get(getPosts);

router.route('/:id')
    .delete(protect, deletePost);

router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);

module.exports = router;
