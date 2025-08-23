// server/models/settingsModel.js

const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true } // سيكون رابطًا من Uploadcare أو التخزين المحلي
});

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'متجري',
        trim: true,
    },
    logoUrl: {
        type: String,
        default: '/default-logo.png',
    },
    aboutUsContent: {
        type: String,
        default: '<h1>من نحن</h1><p>اكتب هنا محتوى صفحة من نحن...</p>',
    },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactAddress: { type: String, trim: true },
    // سنخزن رابط 'embed' من خرائط جوجل
    googleMapsUrl: { type: String, trim: true },
    paymentMethods: [paymentMethodSchema],
}, {
    // لا نستخدم capped collection هنا
    collection: 'settings', 
    timestamps: true // من الجيد دائمًا معرفة متى تم التحديث
});

// Middleware: يتم تشغيله قبل كل عملية حفظ 'save'
// سيمنع إنشاء مستند جديد إذا كان هناك واحد موجود بالفعل
settingsSchema.pre('save', async function(next) {
    const doc = this;
    if (doc.isNew) {
        const count = await mongoose.model('Settings').countDocuments();
        if (count > 0) {
            // نمرر خطأً لمنع إنشاء مستند ثانٍ
            const err = new Error('لا يمكن إنشاء أكثر من مستند إعدادات واحد');
            next(err);
        } else {
            next();
        }
    } else {
        next();
    }
});


// دالة ثابتة لضمان وجود مستند إعدادات واحد على الأقل
settingsSchema.statics.initialize = async function() {
    try {
        const count = await this.countDocuments();
        if (count === 0) {
            console.log('Initializing default settings document...');
            // نستخدم 'new' ثم 'save' لتشغيل الـ middleware
            const newSettings = new this();
            await newSettings.save();
            console.log('Default settings created.');
        }
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;