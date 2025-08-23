// server/controllers/productController.js

const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const fs = require('fs');
const path = require('path');

// ====================================================================
// @desc    إنشاء منتج جديد
// @route   POST /api/products
// @access  Private/Admin
// ====================================================================
const createProduct = async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, countInStock, isVirtual, executionTime, existingImages } = req.body;
        
        if (!req.files?.image && !req.body.existingImage) {
            return res.status(400).json({ message: 'الصورة/المقطع الرئيسي حقل مطلوب' });
        }

        const newImages = req.files.images ? req.files.images.map(f => `/${f.path}`) : [];
        const existingImagesParsed = existingImages ? JSON.parse(existingImages) : [];

        const product = new Product({
            name, description, price, originalPrice, category, countInStock, isVirtual, executionTime,
            user: req.user._id,
            image: req.files.image ? `/${req.files.image[0].path}` : req.body.existingImage,
            images: [...existingImagesParsed, ...newImages],
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error(`Error in createProduct: ${error.message}`);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};

// ====================================================================
// @desc    جلب كل المنتجات
// @route   GET /api/products
// @access  Public
// ====================================================================
const getAllProducts = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.pageNumber) || 1;
        const filter = {};
        const { keyword, category, price_gte, price_lte } = req.query;

        if (price_gte || price_lte) {
            filter.price = {};
            if (price_gte) filter.price.$gte = Number(price_gte);
            if (price_lte) filter.price.$lte = Number(price_lte);
        }
        
        if (category) filter.category = category;

        if (keyword) {
            const matchingCategories = await Category.find({ name: { $regex: keyword, $options: 'i' } }).select('_id');
            const categoryIds = matchingCategories.map(cat => cat._id);
            filter.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { category: { $in: categoryIds } }
            ];
        }

        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter).populate('category', 'name').limit(pageSize).skip(pageSize * (page - 1)).sort({ createdAt: -1 });
        res.json({ products, page, pages: Math.ceil(count / pageSize) });

    } catch (error) {
        console.error(`Error in getAllProducts: ${error.message}`);
        res.status(500).json({ message: "حدث خطأ في الخادم أثناء جلب المنتجات" });
    }
};

// ====================================================================
// @desc    جلب منتج حسب الـ ID
// @route   GET /api/products/:id
// @access  Public
// ====================================================================
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'المنتج غير موجود' });
        }
    } catch (error) {
        console.error(`Error in getProductById: ${error.message}`);
        res.status(500).json({ message: 'خطأ في الخادم أثناء جلب المنتج' });
    }
};

// ====================================================================
// @desc    تحديث منتج
// @route   PUT /api/products/:id
// @access  Private/Admin
// ====================================================================
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, countInStock, isVirtual, executionTime, existingImages, existingImage } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name ?? product.name;
            product.description = description ?? product.description;
            // ... باقي الحقول
            product.isVirtual = isVirtual ?? product.isVirtual;
            product.executionTime = executionTime ?? product.executionTime;

            // تحديث الصورة الرئيسية
            if (req.files.image) {
                product.image = `/${req.files.image[0].path}`;
            } else if (existingImage) {
                product.image = existingImage;
            }

            // تحديث معرض الصور
            const newImages = req.files.images ? req.files.images.map(f => `/${f.path}`) : [];
            const existingImagesParsed = existingImages ? JSON.parse(existingImages) : [];
            product.images = [...existingImagesParsed, ...newImages];
            
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'المنتج غير موجود' });
        }
    } catch (error) {
        console.error(`Error in updateProduct: ${error.message}`);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};

// ====================================================================
// @desc    حذف منتج
// @route   DELETE /api/products/:id
// @access  Private/Admin
// ====================================================================
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            const deleteFile = (filePath) => {
                if (filePath && filePath.length > 1) {
                    const fullPath = path.join(__dirname, '..', filePath);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                }
            };
            deleteFile(product.image);
            if (product.images?.length) product.images.forEach(img => deleteFile(img));
            await product.deleteOne({ _id: req.params.id });
            res.json({ message: 'تم حذف المنتج بنجاح' });
        } else {
            res.status(404).json({ message: 'المنتج غير موجود' });
        }
    } catch (error) {
        console.error(`Error in deleteProduct: ${error.message}`);
        res.status(500).json({ message: 'خطأ في الخادم أثناء حذف المنتج' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};