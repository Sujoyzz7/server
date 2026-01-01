const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationUtils');

const createPost = async (req, res) => {
    const { content, images } = req.body;
    try {
        const post = await Post.create({
            user: req.user._id,
            content,
            images
        });
        const populatedPost = await Post.findById(post._id).populate('user', 'username profilePic isAdmin isVerified');
        res.status(201).json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        // Global Feed: Show all posts from all users
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePic displayName isAdmin isVerified')
            .populate('comments.user', 'username profilePic displayName isAdmin isVerified');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const alreadyLiked = post.likes.find(like => like.toString() === req.user._id.toString());

        if (alreadyLiked) {
            post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
            // Create Notification
            await createNotification(req, post.user, 'like', post._id);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    const { text } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = {
            user: req.user._id,
            text
        };

        post.comments.push(comment);
        await post.save();

        // Create Notification
        await createNotification(req, post.user, 'comment', post._id, text);

        const updatedPost = await Post.findById(post._id)
            .populate('user', 'username profilePic isAdmin isVerified')
            .populate('comments.user', 'username profilePic displayName isAdmin isVerified');

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await post.deleteOne();
        res.json({ message: 'Post removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPost, getPosts, likePost, addComment, deletePost };
