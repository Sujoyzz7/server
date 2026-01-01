const Story = require('../models/Story');
const User = require('../models/User');

const createStory = async (req, res) => {
    const { image } = req.body;
    try {
        const story = await Story.create({
            user: req.user._id,
            image
        });
        const populatedStory = await Story.findById(story._id).populate('user', 'username profilePic');
        res.status(201).json(populatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStories = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const following = user.following;

        // Find stories from users being followed and the current user
        const stories = await Story.find({
            user: { $in: [...following, req.user._id] },
            expiresAt: { $gt: new Date() }
        })
            .populate('user', 'username profilePic')
            .sort({ createdAt: -1 });

        // Group by user
        const groupedStories = [];
        const userMap = new Map();

        stories.forEach(story => {
            if (!userMap.has(story.user._id.toString())) {
                const userStories = {
                    user: story.user,
                    stories: [story]
                };
                userMap.set(story.user._id.toString(), groupedStories.length);
                groupedStories.push(userStories);
            } else {
                groupedStories[userMap.get(story.user._id.toString())].stories.push(story);
            }
        });

        res.json(groupedStories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createStory, getStories };
