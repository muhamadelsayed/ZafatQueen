// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();

// --- 1. التأكد من استيراد كل الدوال المطلوبة ---
const { 
    registerUser, 
    loginUser,
    getUsers,
    deleteUser,
    updateUserRole,
    forgotPassword,      // <-- تأكد من وجودها
    resetPassword,       // <-- تأكد من وجودها
    updatePassword
} = require('../controllers/userController');

const { 
    protect, 
    isAdmin, 
    isSuperAdmin 
} = require('../middleware/authMiddleware');

// --- 2. الترتيب الصحيح للمسارات ---
// المسارات الأكثر تحديدًا (الثابتة) يجب أن تأتي أولاً.

// --- المسارات العامة (لا تتطلب تسجيل دخول) ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword); // <-- المسار الذي يسبب المشكلة
router.put('/resetpassword', resetPassword);

// --- المسارات المحمية (تتطلب تسجيل دخول) ---
router.put('/updatepassword', protect, updatePassword); // <-- مسار ثابت آخر
router.get('/', protect, isAdmin, getUsers); // <-- مسار الجذر (عام نسبيًا)

// --- المسارات المحمية التي تحتوي على متغيرات (تأتي في النهاية) ---
router.route('/:id')
    .delete(protect, isAdmin, deleteUser)
    .put(protect, isSuperAdmin, updateUserRole);

// --- 3. التأكد من تصدير الراوتر ---
module.exports = router; 