// models/settingsModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Settings = sequelize.define('Settings', {
    // الحقل id (Primary Key) يُضاف تلقائياً
    siteName: {
        type: DataTypes.STRING,
        defaultValue: 'متجري',
    },
    logoUrl: {
        type: DataTypes.STRING,
        defaultValue: '/default-logo.png',
    },
    aboutUsContent: {
        type: DataTypes.TEXT, // استخدام TEXT مناسب للمحتوى الطويل مثل HTML
        defaultValue: '<h1>من نحن</h1><p>اكتب هنا محتوى صفحة من نحن...</p>',
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contactAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    googleMapsUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // الحل الأمثل للحفاظ على نفس بنية الـ API هو استخدام نوع بيانات JSON
    // سيقوم بتخزين مصفوفة الـ objects كما هي.
    paymentMethods: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true,
        get() {
            // هذا الـ getter يضمن أن القيمة المرجعة هي دائمًا مصفوفة
            const rawValue = this.getDataValue('paymentMethods');
            if (!rawValue) {
                return []; // إذا كانت القيمة null أو undefined، أرجع مصفوفة فارغة
            }
            // إذا كانت القيمة مخزنة كنص، قم بتحليلها
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return []; // في حالة وجود نص غير صالح، أرجع مصفوفة فارغة
                }
            }
            return rawValue; // إذا كانت بالفعل مصفوفة، أرجعها كما هي
        },
    },
}, {
    // --- خيارات النموذج ---
    timestamps: true,
    tableName: 'settings', // تحديد اسم الجدول بشكل صريح ليتطابق مع Mongoose 'collection'

    // --- Hooks (بديل عن Mongoose middleware) ---
    hooks: {
        // يتم تشغيله قبل محاولة إنشاء سجل جديد فقط
        beforeCreate: async (settings, options) => {
            // تحقق مما إذا كان هناك أي سجل موجود بالفعل في الجدول
            const existingSettings = await Settings.findOne();
            if (existingSettings) {
                // إذا كان هناك سجل، قم بإلقاء خطأ لمنع الإنشاء
                throw new Error('لا يمكن إنشاء أكثر من سجل إعدادات واحد');
            }
        }
    }
});

// --- Static Methods (بديل عن Mongoose statics) ---

// دالة لضمان وجود سجل إعدادات واحد على الأقل عند بدء تشغيل التطبيق
Settings.initialize = async function() {
    try {
        const count = await this.count();
        if (count === 0) {
            console.log('Initializing default settings document...');
            // 'create' ستقوم بتشغيل hook 'beforeCreate' تلقائياً
            await this.create();
            console.log('Default settings created.');
        }
    } catch (error) {
        // نتجاهل الخطأ إذا كان "لا يمكن إنشاء أكثر من سجل..."، لأنه يعني أن سجل آخر تم إنشاؤه للتو
        if (error.message.includes('لا يمكن إنشاء أكثر من سجل')) {
             console.log('Settings document already exists or is being created.');
        } else {
            console.error('Error initializing settings:', error);
        }
    }
};

// وظيفة لتعديل شكل الـ JSON الخارج ليتوافق مع الـ API القديم (_id)
Settings.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id; // أضف حقل _id
    delete values.id;       // احذف الحقل الأصلي

    return values;
};


module.exports = Settings;