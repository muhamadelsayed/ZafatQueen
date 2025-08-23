// server/controllers/settingsController.js

const path = require('path');
const Settings = require('../models/settingsModel');

const getSettings = async (req, res) => {
    const settings = await Settings.findOne();
    res.json(settings);
};

const updateSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            res.status(404);
            throw new Error('لم يتم العثور على الإعدادات');
        }

        // تحديث الحقول النصية
        settings.siteName = req.body.siteName || settings.siteName;
        settings.aboutUsContent = req.body.aboutUsContent || settings.aboutUsContent;
        settings.contactEmail = req.body.contactEmail || settings.contactEmail;
        settings.contactPhone = req.body.contactPhone || settings.contactPhone;
        settings.contactAddress = req.body.contactAddress || settings.contactAddress;
        settings.googleMapsUrl = req.body.googleMapsUrl || settings.googleMapsUrl;

        let paymentMethods = settings.paymentMethods || [];
        if (req.body.paymentMethods) {
            try {
                paymentMethods = JSON.parse(req.body.paymentMethods);
            } catch (e) {
                return res.status(400).json({ message: 'تنسيق وسائل الدفع غير صالح' });
            }
        }
        
        // **الإصلاح هنا: التحقق من وجود الملفات قبل الوصول إليها**
        if (req.files) {
            // معالجة صور وسائل الدفع
            if (req.files.paymentMethodImages && req.files.paymentMethodImages.length > 0) {
                const uploadedImages = req.files.paymentMethodImages;
                let imageIndex = 0;
                paymentMethods = paymentMethods.map(method => {
                    // نتحقق مما إذا كان هذا العنصر ينتظر ملفًا مرفوعًا
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
            
            // معالجة الشعار
            if (req.files.logo && req.files.logo.length > 0) {
                settings.logoUrl = path.join('/uploads', req.files.logo[0].filename).replace(/\\/g, '/');
            }
        }
        
        settings.paymentMethods = paymentMethods;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);

    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500);
        throw new Error('فشل في تحديث الإعدادات');
    }
};

module.exports = { getSettings, updateSettings };