// server/routes/statsRoutes.js

const express = require('express');
const router = express.Router();
const { getSummaryStats } = require('../controllers/statsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// المسار محمي للمدراء فقط
router.get('/summary', protect, isAdmin, getSummaryStats);

module.exports = router;