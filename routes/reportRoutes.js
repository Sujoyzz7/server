const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/reports
// @desc    Report a post
// @access  Private
router.post('/', protect, async (req, res) => {
    const { postId, reason, description } = req.body;

    if (!postId || !reason) {
        return res.status(400).json({ message: 'Post ID and reason are required' });
    }

    try {
        // Check if user already reported this post? (Optional, but good for spam prevention)
        const existingReport = await Report.findOne({ post: postId, reporter: req.user._id });
        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this post.' });
        }

        const report = new Report({
            post: postId,
            reporter: req.user._id,
            reason,
            description
        });

        await report.save();
        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
