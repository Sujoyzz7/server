const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await User.deleteOne({ _id: user._id });
            await Post.deleteMany({ user: user._id }); // Delete user's posts
            await Report.deleteMany({ reporter: user._id }); // Delete reports made by user
            // Optional: delete reports AGAINST user's posts?
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/admin/users/:id
// @desc    Update user (ban, verify, etc)
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Check for fields in body and update safely
            if (req.body.isBanned !== undefined) user.isBanned = req.body.isBanned;
            if (req.body.isVerified !== undefined) user.isVerified = req.body.isVerified;
            if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                isBanned: updatedUser.isBanned,
                isVerified: updatedUser.isVerified
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/stats
// @desc    Get dashboard stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const reportCount = await Report.countDocuments({ status: 'pending' });

        res.json({
            userCount,
            postCount,
            reportCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/reports
// @desc    Get all reports
// @access  Private/Admin
router.get('/reports', protect, admin, async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate('reporter', 'username profilePic')
            .populate({
                path: 'post',
                populate: {
                    path: 'user',
                    select: 'username'
                }
            })
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/admin/reports/:id
// @desc    Update report status
// @access  Private/Admin
router.put('/reports/:id', protect, admin, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (report) {
            report.status = req.body.status || report.status;
            const updatedReport = await report.save();
            res.json(updatedReport);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/admin/posts/:id
// @desc    Delete a post by admin
// @access  Private/Admin
router.delete('/posts/:id', protect, admin, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post) {
            await Post.deleteOne({ _id: post._id });
            // Optionally, we could update reports related to this post to status 'resolved' or 'action_taken'
            await Report.updateMany({ post: post._id }, { status: 'action_taken' });

            res.json({ message: 'Post removed' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
