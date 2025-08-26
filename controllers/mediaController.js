// server/controllers/mediaController.js
const Media = require('../models/mediaModel');
const path = require('path');
const fs = require('fs');

// هذه الدالة لا تتعلق بقاعدة البيانات، لذا تبقى كما هي
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
    if (!req.file) {
        res.status(400);
        throw new Error('لم يتم إرفاق أي ملف');
    }
    
    // Sequelize: Media.create() مع تحديث uploadedBy
    const media = await Media.create({
        fileName: req.file.originalname,
        fileUrl: path.join('/uploads/media', req.file.filename).replace(/\\/g, '/'),
        fileType: getFileType(req.file.mimetype),
        uploadedBy: req.user.id, // استخدام req.user.id
        size: req.file.size,
    });

    // toJSON سيتم استدعاؤها تلقائياً لتحويل id إلى _id
    res.status(201).json(media);
};

// @desc    جلب كل الملفات من المكتبة مع دعم الترقيم
// @route   GET /api/media
// @access  Private/Admin
exports.getAllMedia = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Sequelize: استخدام findAndCountAll للترقيم الفعال
    const { count, rows } = await Media.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
    });

    res.json({
        mediaFiles: rows, // 'rows' تحتوي على الملفات
        page,
        pages: Math.ceil(count / limit),
        total: count // 'count' هو العدد الإجمالي
    });
};

// @desc    حذف ملف
// @route   DELETE /api/media/:id
// @access  Private/Admin
exports.deleteMediaFile = async (req, res) => {
    // Sequelize: Model.findByPk() للبحث بواسطة ID
    const mediaFile = await Media.findByPk(req.params.id);

    if (mediaFile) {
        // منطق حذف الملف الفعلي من الخادم لا يتغير
        const filePath = path.join(__dirname, '..', mediaFile.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Sequelize: instance.destroy() لحذف السجل من قاعدة البيانات
        await mediaFile.destroy();
        res.json({ message: 'تم حذف الملف بنجاح' });
    } else {
        res.status(404);
        throw new Error('الملف غير موجود');
    }
};