// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. استخلاص التوكن من الـ header
            token = req.headers.authorization.split(' ')[1];

            // 2. التحقق من صحة التوكن وفك تشفيره
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. جلب بيانات المستخدم باستخدام Sequelize
            // findByPk هو البديل لـ findById
            req.user = await User.findByPk(decoded.id);

            // لم نعد بحاجة لـ .select('-password') لأن وظيفة toJSON في النموذج
            // ستقوم بحذف كلمة المرور تلقائياً عند تحويل الكائن إلى JSON.

            if (!req.user) {
                res.status(401);
                throw new Error('المستخدم المرتبط بهذا التوكن لم يعد موجودًا');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('غير مصرح لك بالدخول، التوكن فشل');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('غير مصرح لك بالدخول، لا يوجد توكن');
    }
};

// لا حاجة لتغيير هذه الدوال لأنها تعتمد على req.user الذي تم جلبه من دالة protect
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403);
        throw new Error('الوصول محظور. هذه الوظيفة متاحة للـ Super Admin فقط.');
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403);
        throw new Error('الوصول محظور. هذه الوظيفة متاحة للمدراء فقط.');
    }
};

module.exports = { protect, isSuperAdmin, isAdmin };