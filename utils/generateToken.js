// utils/generateToken.js

const jwt = require('jsonwebtoken');
require('dotenv').config(); // Import and configure dotenv to load environment variables

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // صلاحية التوكن: 30 يومًا
    });
};

module.exports = generateToken;