// server/models/categoryModel.js

const mongoose = require('mongoose');
// تأكد من أن المسار صحيح. إذا كان productModel.js في نفس المجلد، فهذا صحيح.
const Product = require('./productModel'); 

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, { timestamps: true });

// Middleware: يتم تشغيله قبل تنفيذ عملية 'deleteOne' على مستند
// { document: true, query: false } ضروري لجعل 'this' يشير إلى المستند الذي سيتم حذفه
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    console.log(`[Middleware] يتم الآن حذف المنتجات المرتبطة بالقسم: ${this.name} (ID: ${this._id})`);
    
    try {
        // ابحث عن كل المنتجات التي لها نفس الـ ID واحذفها
        const result = await Product.deleteMany({ category: this._id });
        console.log(`[Middleware] تم حذف ${result.deletedCount} منتج.`);
        next(); // أكمل عملية الحذف الأصلية للقسم
    } catch (error) {
        console.error(`[Middleware] حدث خطأ أثناء حذف المنتجات: `, error);
        next(error); // مرر الخطأ لإيقاف العملية
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;