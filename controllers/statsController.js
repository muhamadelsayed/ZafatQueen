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
            // Sequelize: Model.count()
            Product.count(),
            Category.count(),
            User.count(),
            // Sequelize: Model.findAll() with options
            Product.findAll({
                order: [['createdAt', 'DESC']], // بديل لـ .sort()
                limit: 5, // بديل لـ .limit()
                attributes: ['id', 'name', 'price', 'createdAt'] // بديل لـ .select()
            })
        ]);

        // ملاحظة: وظيفة toJSON التي عرفناها في النماذج ستقوم تلقائياً بتحويل 'id' إلى '_id'
        // في كل منتج داخل مصفوفة latestProducts عند استدعاء res.json()
        res.json({
            totalProducts,
            totalCategories,
            totalUsers,
            latestProducts,
        });
    } catch (error) {
        console.error("Error fetching summary stats:", error); // أفضل لإظهار الخطأ في السجل
        res.status(500);
        throw new Error('فشل في جلب الإحصائيات');
    }
};

module.exports = { getSummaryStats };