// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    // التحقق من أن التوكن موجود في الـ headers ويبدأ بكلمة Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. استخلاص التوكن من الـ header
            token = req.headers.authorization.split(' ')[1];

            // 2. التحقق من صحة التوكن وفك تشفيره
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. جلب بيانات المستخدم من قاعدة البيانات باستخدام الـ id الموجود في التوكن
            //    وإرفاقها مع كائن الطلب (req) حتى نتمكن من استخدامها في أي مسار محمي
            req.user = await User.findById(decoded.id).select('-password'); // لا نريد جلب كلمة المرور

            next(); // اسمح للطلب بالمرور إلى الخطوة التالية (وحدة التحكم)
        } catch (error) {
            console.error(error);
            res.status(401); // Unauthorized
            throw new Error('غير مصرح لك بالدخول، التوكن فشل');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('غير مصرح لك بالدخول، لا يوجد توكن');
    }
};

// يمكننا إضافة وسيط آخر للتحقق من أن المستخدم هو superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403); // Forbidden
        throw new Error('الوصول محظور. هذه الوظيفة متاحة للـ Super Admin فقط.');
    }
};
const isAdmin = (req, res, next) => {
    // نفترض أن وسيط 'protect' قد تم استدعاؤه قبله
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403); // Forbidden
        throw new Error('الوصول محظور. هذه الوظيفة متاحة للمدراء فقط.');
    }
};


module.exports = { protect, isSuperAdmin, isAdmin };