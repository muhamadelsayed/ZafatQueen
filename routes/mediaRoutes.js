// server/routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadFile, getAllMedia, deleteMediaFile } = require('../controllers/mediaController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/media/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// مسار الرفع لم يتغير
router.route('/upload')
    .post(protect, isAdmin, upload.single('file'), uploadFile);

// **هذا هو المسار الجديد لجلب كل الوسائط**
router.route('/')
    .get(protect, isAdmin, getAllMedia);

// مسار الحذف لم يتغير
router.route('/:id')
    .delete(protect, isAdmin, deleteMediaFile);

module.exports = router;