// server/controllers/userController.js

const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto'); // <-- **أضف هذا السطر في الأعلى**
const sendEmail = require('../config/mailer');

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('المستخدم مسجل بالفعل');
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('بيانات المستخدم غير صالحة');
    }
};

/**
 * @desc    تسجيل دخول المستخدم والحصول على توكن
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });
} else {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
}
};

/**
 * @desc    جلب كل المستخدمين
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

/**
 * @desc    حذف مستخدم
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
    const userToDelete = await User.findById(req.params.id);

    if (userToDelete) {
        if (userToDelete.role === 'superadmin') {
            res.status(400);
            throw new Error('لا يمكن حذف حساب السوبر أدمن.');
        }

        if (req.user._id.toString() === userToDelete._id.toString()) {
            res.status(400);
            throw new Error('لا يمكنك حذف حسابك الخاص.');
        }

        await User.deleteOne({ _id: userToDelete._id });
        res.json({ message: 'تم حذف المستخدم بنجاح' });
    } else {
        res.status(404);
        throw new Error('المستخدم غير موجود');
    }
};

/**
 * @desc    تحديث دور المستخدم
 * @route   PUT /api/users/:id
 * @access  Private/SuperAdmin
 */
const updateUserRole = async (req, res) => {
    const userToUpdate = await User.findById(req.params.id);

    if (userToUpdate) {
        const allowedRoles = ['user', 'admin'];
        if (!allowedRoles.includes(req.body.role)) {
            res.status(400);
            throw new Error('الدور المحدد غير صالح.');
        }

        userToUpdate.role = req.body.role || userToUpdate.role;

        const updatedUser = await userToUpdate.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('المستخدم غير موجود');
    }
};

const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        // نرسل رسالة نجاح حتى لو كان الإيميل غير موجود لحماية الخصوصية
        return res.status(200).json({ message: 'تم إرسال الإيميل إذا كان مسجلاً' });
    }

    // إنشاء رمز إعادة التعيين
    const resetToken = crypto.randomBytes(20).toString('hex');

    // تشفير الرمز وتخزينه في قاعدة البيانات
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // صلاحية 10 دقائق

    await user.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            email: user.email,
            subject: 'إعادة تعيين كلمة المرور',
            message: `لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي لإكمال العملية: \n\n${resetToken}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`,
        });
        res.status(200).json({ message: 'تم إرسال الإيميل بنجاح' });
    } catch (error) {
        console.error(error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500);
        throw new Error('فشل في إرسال الإيميل');
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    
    // تشفير الرمز القادم من المستخدم لمقارنته
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }, // تحقق من أن الرمز لم تنتهِ صلاحيته
    });

    if (!user) {
        res.status(400);
        throw new Error('الرمز غير صالح أو انتهت صلاحيته');
    }

    // تعيين كلمة المرور الجديدة
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
};

const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // **الإصلاح هنا: إضافة تحقق من وجود المستخدم**
    // نبحث عن المستخدم ونجلب كلمة المرور بشكل صريح
    const user = await User.findById(req.user.id).select('+password');
    
    // التحقق من أننا وجدنا المستخدم
    if (!user) {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم');
    }
    
    // التحقق من كلمة المرور القديمة
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('كلمة المرور الحالية غير صحيحة');
    }

    // إذا تطابقت، قم بتحديثها
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'تم تحديث كلمة المرور بنجاح' });
};

module.exports = { 
    registerUser, 
    loginUser,
    getUsers,
    deleteUser,
    updateUserRole,
    forgotPassword, // <-- **تأكد من وجود هذه**
    resetPassword,  // <-- **تأكد من وجود هذه**
    updatePassword
};