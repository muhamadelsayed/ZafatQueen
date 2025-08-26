// routes/customCssRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllCssRules,
    getPublicCssRules,
    saveCssRule,
    deleteCssRule
} = require('../controllers/customCssController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// مسار عام لجلب كل الـ CSS للعرض
router.get('/public', getPublicCssRules);

// مسارات محمية للادمن
router.route('/')
    .get(protect, isAdmin, getAllCssRules)
    .post(protect, isAdmin, saveCssRule);

router.route('/:id')
    .delete(protect, isAdmin, deleteCssRule);

module.exports = router;