require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

connectDB();

const listUsers = async () => {
    try {
        const users = await User.find({}, 'username email isAdmin');
        console.log('--- Available Users ---');
        users.forEach(user => {
            console.log(`Username: ${user.username} | Email: ${user.email} | Admin: ${user.isAdmin}`);
        });
        console.log('-----------------------');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
