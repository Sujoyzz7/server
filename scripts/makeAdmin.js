require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Connect to DB
connectDB();

const makeAdmin = async () => {
    const args = process.argv.slice(2);
    const username = args[0];

    if (!username) {
        console.log('Please provide a username to make admin');
        console.log('Usage: node scripts/makeAdmin.js <username>');
        process.exit(1);
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();

        console.log(`User ${username} is now an admin`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

makeAdmin();
