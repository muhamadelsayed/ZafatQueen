// controllers/categoryController.js

const Category = require('../models/categoryModel');

// @desc    إنشاء قسم جديد
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    const { name } = req.body;

    // Sequelize: Category.create() تعمل بنفس الطريقة
    // سيتم استدعاء toJSON تلقائياً عند الإرسال
    const category = await Category.create({ name });
    res.status(201).json(category);
};

// @desc    جلب كل الأقسام
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
    // Sequelize: Model.findAll()
    const categories = await Category.findAll({
        order: [['createdAt', 'ASC']] // للحفاظ على ترتيب معين إذا أردت
    });
    res.json(categories);
};

// @desc    تحديث قسم
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    // Sequelize: Find, update, then save
    const category = await Category.findByPk(req.params.id);

    if (category) {
        category.name = req.body.name || category.name;
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('القسم غير موجود');
    }
};

// @desc    حذف قسم
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (category) {
        // Sequelize: instance.destroy()
        // بفضل 'onDelete: CASCADE' في تعريف العلاقة، ستقوم قاعدة البيانات بحذف كل المنتجات المرتبطة تلقائياً.
        await category.destroy(); 
        res.json({ message: 'تم حذف القسم والمنتجات المرتبطة به' });
    } else {
        res.status(404);
        throw new Error('القسم غير موجود');
    }
};