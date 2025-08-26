// server/controllers/productController.js

const { Op } = require('sequelize');
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

        // Sequelize: Product.create() مع استخدام أسماء الحقول الجديدة (userId, categoryId)
        const createdProduct = await Product.create({
            name,
            description,
            price,
            originalPrice,
            countInStock,
            isVirtual: isVirtual === 'true', // تأكد من تحويلها إلى boolean
            executionTime,
            image: req.files.image ? `/${req.files.image[0].path}` : req.body.existingImage,
            images: [...existingImagesParsed, ...newImages],
            userId: req.user.id, // استخدام req.user.id من middleware
            categoryId: category || null, // استخدام categoryId
        });

        // toJSON() سيتم استدعاؤها تلقائياً
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
        const { keyword, category, price_gte, price_lte } = req.query;

        // بناء كائن الـ where الخاص بـ Sequelize
        const whereClause = {};

        if (price_gte || price_lte) {
            whereClause.price = {};
            if (price_gte) whereClause.price[Op.gte] = Number(price_gte);
            if (price_lte) whereClause.price[Op.lte] = Number(price_lte);
        }
        
        if (category) whereClause.categoryId = category;

        if (keyword) {
            // Sequelize: البحث في الأقسام المطابقة أولاً
            const matchingCategories = await Category.findAll({
                where: { name: { [Op.like]: `%${keyword}%` } },
                attributes: ['id']
            });
            const categoryIds = matchingCategories.map(cat => cat.id);
            
            // Sequelize: بناء شرط $or
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { categoryId: { [Op.in]: categoryIds } }
            ];
        }

        // Sequelize: استخدام findAndCountAll للترقيم (Pagination)
        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            include: { // بديل لـ .populate()
                model: Category,
                as: 'category', // الاسم المستعار الذي عرفناه في server.js
                attributes: ['name']
            },
            limit: pageSize,
            offset: pageSize * (page - 1),
            order: [['createdAt', 'DESC']],
            distinct: true, // ضروري للحصول على count صحيح عند استخدام include
        });
        
        res.json({ products: rows, page, pages: Math.ceil(count / pageSize) });

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
        const product = await Product.findByPk(req.params.id, {
            include: {
                model: Category,
                as: 'category',
                // --- **الإصلاح الرئيسي هنا** ---
                // أضف 'id' إلى قائمة attributes
                attributes: ['id', 'name'] 
                // --- **نهاية الإصلاح** ---
            }
        });

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
        const product = await Product.findByPk(req.params.id);

        if (product) {
            // تحديث الحقول مع تنقية البيانات (كما فعلنا سابقًا)
            product.name = name ?? product.name;
            product.description = description ?? product.description;
            product.executionTime = executionTime ?? product.executionTime;
            product.price = price !== undefined ? Number(price) : product.price;
            product.originalPrice = originalPrice ? Number(originalPrice) : null;
            product.countInStock = countInStock ? Number(countInStock) : null;
            product.categoryId = category ? Number(category) : null;
product.isVirtual = (String(isVirtual) === 'true');

            // تحديث الوسائط (كما فعلنا سابقًا)
            if (req.files && req.files.image) {
                product.image = `/${req.files.image[0].path}`;
            } else if (existingImage) {
                product.image = existingImage;
            }

            const newImages = (req.files && req.files.images) ? req.files.images.map(f => `/${f.path}`) : [];
            const existingImagesParsed = existingImages ? JSON.parse(existingImages) : [];
            product.images = [...existingImagesParsed, ...newImages];
            
            // 1. احفظ التغييرات
            await product.save();

            // --- **الإصلاح الرئيسي هنا** ---
            // 2. أعد تحميل المنتج المحدث مع تفاصيل القسم
            const updatedProductWithCategory = await Product.findByPk(product.id, {
                include: {
                    model: Category,
                    as: 'category',
                    attributes: ['name']
                }
            });

            // 3. أرسل المنتج المحدث بالكامل كرد
            res.json(updatedProductWithCategory);

        } else {
            res.status(404).json({ message: 'المنتج غير موجود' });
        }
    } catch (error) {
        console.error(`Error in updateProduct:`, error);
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
        const product = await Product.findByPk(req.params.id);
        if (product) {
            // منطق حذف الملفات من السيرفر لا يتغير
            const deleteFile = (filePath) => {
                if (filePath && filePath.length > 1) {
                    const fullPath = path.join(__dirname, '..', filePath);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                }
            };
            deleteFile(product.image);
            if (product.images?.length) product.images.forEach(img => deleteFile(img));

            // Sequelize: instance.destroy()
            await product.destroy();
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