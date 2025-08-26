// models/categoryModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
    // id (Primary Key) يُضاف تلقائياً
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'اسم القسم يجب أن يكون فريداً'
        },
        // بديل عن trim: true في Mongoose
        set(value) {
            // trim any whitespace before saving
            this.setDataValue('name', value.trim());
        }
    }
}, {
    // --- خيارات النموذج ---
    timestamps: true,
    // لا حاجة لـ hooks هنا، لأن الحذف المتتالي سيتم عن طريق تعريف العلاقة
});


// وظيفة لتعديل شكل الـ JSON الخارج ليتوافق مع الـ API القديم (_id)
Category.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id; // أضف حقل _id
    delete values.id;       // احذف الحقل الأصلي

    return values;
};

module.exports = Category;