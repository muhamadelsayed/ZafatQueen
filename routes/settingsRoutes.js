// server/routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// **استخدام نفس إعدادات التخزين التي نجحت مع المنتجات**
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // الحفظ في نفس مجلد 'uploads'
    },
    filename(req, file, cb) {
        // إنشاء اسم فريد للملف
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mpeg|mp3|wav|ogg/;
    const mimetypes = /image|video|audio/;

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('يمكن رفع الصور وملفات الفيديو والصوت فقط!'));
    }
}


const upload = multer({ 
    storage,
    // يمكنك إضافة fileFilter هنا إذا أردت
});

router.route('/')
    .get(getSettings)
    // **استخدام .fields() للسماح بحقول ملفات متعددة**
    .put(protect, isAdmin, upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'paymentMethodImages', maxCount: 10 } 
    ]), updateSettings);

module.exports = router;