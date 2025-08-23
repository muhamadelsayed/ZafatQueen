// controllers/categoryController.js

const Category = require('../models/categoryModel');

// @desc    إنشاء قسم جديد
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
};

// @desc    جلب كل الأقسام
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
};

// @desc    تحديث قسم
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!category) {
        res.status(404);
        throw new Error('القسم غير موجود');
    }
    res.json(category);
};

// @desc    حذف قسم
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await category.deleteOne({ _id: req.params.id }); 
        res.json({ message: 'تم حذف القسم والمنتجات المرتبطة به' });
    } else {
        res.status(404);
        throw new Error('القسم غير موجود');
    }
};