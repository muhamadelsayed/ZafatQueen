// server/controllers/settingsController.js

const path = require('path');
const Settings = require('../models/settingsModel');

// @desc    جلب إعدادات الموقع
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
    // Sequelize: Model.findOne() للبحث عن أول سجل (وبما أنه يوجد سجل واحد فقط، فهذا كافٍ)
    // وظيفة toJSON ستحول 'id' إلى '_id' تلقائياً
    const settings = await Settings.findOne();
    
    if (!settings) {
        // هذا السيناريو لا يفترض أن يحدث بسبب دالة initialize، ولكنه جيد كحماية إضافية
        res.status(404);
        throw new Error('لم يتم العثور على الإعدادات. الرجاء إعادة تشغيل الخادم.');
    }

    res.json(settings);
};

// @desc    تحديث إعدادات الموقع
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        // Sequelize: Model.findOne()
        const settings = await Settings.findOne();
        if (!settings) {
            res.status(404);
            throw new Error('لم يتم العثور على الإعدادات');
        }

        // --- منطق تحديث الحقول لم يتغير ---

        // تحديث الحقول النصية باستخدام .set() لتحديث عدة حقول مرة واحدة
        settings.set({
            siteName: req.body.siteName || settings.siteName,
            aboutUsContent: req.body.aboutUsContent || settings.aboutUsContent,
            contactEmail: req.body.contactEmail || settings.contactEmail,
            contactPhone: req.body.contactPhone || settings.contactPhone,
            contactAddress: req.body.contactAddress || settings.contactAddress,
            googleMapsUrl: req.body.googleMapsUrl || settings.googleMapsUrl
        });


        let paymentMethods = settings.paymentMethods || [];
        if (req.body.paymentMethods) {
            try {
                // ملاحظة: بما أن الحقل الآن من نوع JSON، قد لا تحتاج إلى JSON.parse
                // إذا كان الـ client يرسل application/json. لكن من الآمن إبقاؤها للطلبات من نوع form-data.
                paymentMethods = typeof req.body.paymentMethods === 'string' 
                    ? JSON.parse(req.body.paymentMethods) 
                    : req.body.paymentMethods;
            } catch (e) {
                return res.status(400).json({ message: 'تنسيق وسائل الدفع غير صالح' });
            }
        }
        
        if (req.files) {
            if (req.files.paymentMethodImages && req.files.paymentMethodImages.length > 0) {
                const uploadedImages = req.files.paymentMethodImages;
                let imageIndex = 0;
                paymentMethods = paymentMethods.map(method => {
                    if (method.imageUploadIndex === imageIndex) {
                        const file = uploadedImages[imageIndex];
                        imageIndex++;
                        return {
                            ...method,
                            imageUrl: path.join('/uploads', file.filename).replace(/\\/g, '/')
                        };
                    }
                    return method;
                });
            }
            
            if (req.files.logo && req.files.logo.length > 0) {
                settings.logoUrl = path.join('/uploads', req.files.logo[0].filename).replace(/\\/g, '/');
            }
        }
        
        settings.paymentMethods = paymentMethods;

        // Sequelize: instance.save() تعمل بنفس الطريقة لحفظ التغييرات
        const updatedSettings = await settings.save();
        
        // toJSON ستعمل تلقائياً هنا أيضاً
        res.json(updatedSettings);

    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500);
        throw new Error('فشل في تحديث الإعدادات');
    }
};

module.exports = { getSettings, updateSettings };