// server/controllers/mediaController.js
const Media = require('../models/mediaModel');
const path = require('path');
const fs = require('fs');

const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'other';
};

// @desc    رفع ملف جديد
// @route   POST /api/media/upload
// @access  Private/Admin
exports.uploadFile = async (req, res) => {
    // ... الكود الحالي بدون تغيير ...
    if (!req.file) {
        res.status(400);
        throw new Error('لم يتم إرفاق أي ملف');
    }
    const media = await Media.create({
        fileName: req.file.originalname,
        fileUrl: path.join('/uploads/media', req.file.filename).replace(/\\/g, '/'),
        fileType: getFileType(req.file.mimetype),
        uploadedBy: req.user._id,
        size: req.file.size,
    });
    res.status(201).json(media);
};

// @desc    جلب كل الملفات من المكتبة مع دعم الترقيم
// @route   GET /api/media
// @access  Private/Admin
exports.getAllMedia = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12; // عدد العناصر في كل صفحة
    const page = parseInt(req.query.page) || 1;   // رقم الصفحة الحالية

    const count = await Media.countDocuments();
    const mediaFiles = await Media.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(limit * (page - 1));

    res.json({
        mediaFiles,
        page,
        pages: Math.ceil(count / limit),
        total: count
    });
};

// @desc    حذف ملف
// @route   DELETE /api/media/:id
// @access  Private/Admin
exports.deleteMediaFile = async (req, res) => {
    // ... الكود الحالي بدون تغيير ...
    const mediaFile = await Media.findById(req.params.id);
    if (mediaFile) {
        const filePath = path.join(__dirname, '..', mediaFile.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        await Media.deleteOne({ _id: mediaFile._id });
        res.json({ message: 'تم حذف الملف بنجاح' });
    } else {
        res.status(404);
        throw new Error('الملف غير موجود');
    }
};