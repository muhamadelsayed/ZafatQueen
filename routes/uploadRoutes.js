// server/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- إعدادات Multer للتخزين المحلي ---
const storage = multer.diskStorage({
    destination(req, file, cb) {
        // حفظ الملفات في مجلد 'uploads'
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // إنشاء اسم فريد للملف
        cb(null, `file-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// دالة للتحقق من أن الملف هو صورة أو فيديو أو صوت
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mpeg|mp3|wav|ogg/;
    const mimetypes = /image|video|audio/;

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('يجب رفع الصور أو مقاطع الفيديو أو الصوت فقط!'));
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// --- تعريف المسار ---
// 'image' هو اسم الحقل، لكننا سنعيد مسارًا عامًا
router.post('/', protect, isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    }
    
    // بناء المسار الذي سيتم إرجاعه إلى الواجهة الأمامية
    const fileUrl = path.join('/uploads', req.file.filename).replace(/\\/g, '/');

    res.status(200).json({ 
        // سنبقي الاسم كما هو لتجنب كسر الكود الحالي في محرر النصوص
        imageUrl: fileUrl 
    });
});

module.exports = router;