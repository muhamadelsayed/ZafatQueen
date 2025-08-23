// models/productModel.js

const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        // ربط المنتج بالـ Admin الذي أنشأه
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // يشير إلى نموذج المستخدم
        },
        name: {
            type: String,
            required: [true, 'الرجاء إدخال اسم المنتج'],
        },
        image: {
            type: String, // سيتم تخزين مسار الصورة هنا
            required: true,
        },
        images: {
            type: [String], // مصفوفة من مسارات الصور لمعرض الصور
        },
        description: {
            type: String,
            required: [true, 'الرجاء إدخال وصف المنتج'],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId, // النوع هو ID من Mongoose
            ref: 'Category', // يشير إلى نموذج 'Category' الذي سننشئه
            // لا يوجد required: true، مما يجعله اختياريًا
        },
        price: {
            type: Number,
            required: [true, 'الرجاء إدخال السعر الحالي للمنتج'],
            default: 0,
        },
        originalPrice: {
            type: Number,
            // ليس مطلوبًا، سيتم عرضه فقط إذا كان أكبر من السعر الحالي
        },
        countInStock: {
            type: Number,
            required: function() { return !this.isVirtual; },
            default: 0,
        },
        isVirtual: {
            type: Boolean,
            required: true,
            default: false,
        },
        executionTime: {
            type: String,
            trim: true, // اختياري، لإزالة المسافات الزائدة
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;