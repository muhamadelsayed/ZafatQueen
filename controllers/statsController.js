// server/controllers/statsController.js

const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');

// @desc    جلب إحصائيات ملخصة للوحة التحكم
// @route   GET /api/stats/summary
// @access  Private/Admin
const getSummaryStats = async (req, res) => {
    try {
        // تنفيذ جميع الاستعلامات بالتوازي لتحسين الأداء
        const [
            totalProducts,
            totalCategories,
            totalUsers,
            latestProducts,
        ] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            User.countDocuments(),
            Product.find().sort({ createdAt: -1 }).limit(5).select('name price createdAt')
        ]);

        res.json({
            totalProducts,
            totalCategories,
            totalUsers,
            latestProducts,
        });
    } catch (error) {
        res.status(500);
        throw new Error('فشل في جلب الإحصائيات');
    }
};

module.exports = { getSummaryStats };