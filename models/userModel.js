// models/userModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'admin', 'superadmin'], // <-- إضافة 'user'
            default: 'user',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true, // لإضافة حقلي createdAt و updatedAt تلقائياً
    }
);

// تشفير كلمة المرور قبل حفظ المستخدم في قاعدة البيانات
userSchema.pre('save', async function (next) {
    // نفذ هذا الكود فقط إذا تم تعديل كلمة المرور (أو كانت جديدة)
    if (!this.isModified('password')) {
        return next();
    }

    // توليد "ملح" لزيادة قوة التشفير
    const salt = await bcrypt.genSalt(10);
    // تشفير كلمة المرور مع الملح
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// إضافة وظيفة للنموذج لمقارنة كلمة المرور المدخلة بالكلمة المشفرة
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;