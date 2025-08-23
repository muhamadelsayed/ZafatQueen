// server/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // **مهم: الحفظ في المجلد الرئيسي uploads**
    },
    filename(req, file, cb) {
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
    }
    cb(new Error('يمكن رفع الصور وملفات الفيديو والصوت فقط!'));
}

const upload = multer({
    storage,
    fileFilter: checkFileType
});

const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

router.route('/')
    .get(getAllProducts)
    .post(protect, uploadFields, createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, uploadFields, updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;