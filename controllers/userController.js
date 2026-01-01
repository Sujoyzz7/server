const User = require('../models/User');
const Post = require('../models/Post');
const { createNotification } = require('../utils/notificationUtils');

const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) return res.status(400).json({ message: 'Username required' });

        const decodedUsername = decodeURIComponent(username).trim();

        // Try direct match first (most efficient)
        let user = await User.findOne({ username: decodedUsername }).select('-password');

        // If not found, try case-insensitive match
        if (!user) {
            const escapedUsername = decodedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            user = await User.findOne({
                username: { $regex: new RegExp('^' + escapedUsername + '$', 'i') }
            }).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePic displayName isAdmin isVerified')
            .populate('comments.user', 'username profilePic displayName isAdmin isVerified');

        res.json({ user, posts });
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const followUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const alreadyFollowing = (currentUser.following || []).some(id => id && id.toString() === req.params.id);

        if (alreadyFollowing) {
            currentUser.following = (currentUser.following || []).filter(id => id && id.toString() !== req.params.id);
            userToFollow.followers = (userToFollow.followers || []).filter(id => id && id.toString() !== req.user._id.toString());
        } else {
            if (!currentUser.following) currentUser.following = [];
            if (!userToFollow.followers) userToFollow.followers = [];

            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user._id);
            // Create Notification
            await createNotification(req, req.params.id, 'follow');
        }

        await currentUser.save();
        await userToFollow.save();

        res.json({
            message: alreadyFollowing ? 'Unfollowed' : 'Followed',
            following: currentUser.following
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { bio, profilePic, coverPhoto, displayName, username, work, school, college } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Handle username change
        if (username && username !== user.username) {
            // Check if new username is unique
            const existingUser = await User.findOne({
                username: { $regex: new RegExp('^' + username.trim() + '$', 'i') }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            user.username = username.trim();
        }

        if (displayName !== undefined) user.displayName = displayName;
        if (bio !== undefined) user.bio = bio;
        if (profilePic !== undefined) user.profilePic = profilePic;
        if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;
        if (work !== undefined) user.work = work;
        if (school !== undefined) user.school = school;
        if (college !== undefined) user.college = college;

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } }
            ]
        }).select('username displayName profilePic bio isAdmin isVerified');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuggestedUsers = async (req, res) => {
    try {
        // Simple fallback for req.user if not using protect
        const excludeId = req.user ? req.user._id : null;

        const match = excludeId ? { _id: { $ne: excludeId } } : {};

        const users = await User.aggregate([
            { $match: match },
            { $sample: { size: 5 } },
            { $project: { password: 0, email: 0 } }
        ]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUserProfile, followUser, updateProfile, searchUsers, getUserById, getSuggestedUsers };
