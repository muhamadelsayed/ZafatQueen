// models/userModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // استيراد كائن sequelize للاتصال
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    // Sequelize يضيف حقل 'id' تلقائياً (Primary Key, integer, auto-increment)
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'اسم المستخدم مسجل بالفعل' // رسالة خطأ مخصصة
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'البريد الإلكتروني مسجل بالفعل'
        },
        validate: {
            isEmail: {
                msg: 'الرجاء إدخال بريد إلكتروني صالح'
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
            isIn: {
                args: [['user', 'admin', 'superadmin']],
                msg: "الدور المحدد غير صالح"
            }
        }
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true, // الحقل اختياري
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true, // الحقل اختياري
    }
}, {
    // --- خيارات النموذج ---
    timestamps: true, // يضيف createdAt و updatedAt تلقائياً
    
    // --- Hooks (بديل عن Mongoose pre/post middleware) ---
    hooks: {
        // تشفير كلمة المرور قبل إنشاء مستخدم جديد
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        // تشفير كلمة المرور قبل تحديثها
        beforeUpdate: async (user) => {
            // تحقق مما إذا كان حقل كلمة المرور قد تم تغييره
             if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// --- Methods (بديل عن Mongoose methods) ---

// وظيفة لمقارنة كلمة المرور المدخلة بالكلمة المشفرة
User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// وظيفة لتعديل شكل الـ JSON الخارج ليتوافق مع الـ API القديم
User.prototype.toJSON = function () {
    // احصل على نسخة من بيانات النموذج
    const values = { ...this.get() };

    // 1. أضف حقل _id ليتوافق مع Mongoose
    values._id = values.id;

    // 2. احذف الحقول التي لا نريد إظهارها في الـ response
    delete values.id; // نحذف id الأصلي
    delete values.password; // الأهم: لا ترسل كلمة المرور أبداً!

    return values;
};


module.exports = User;