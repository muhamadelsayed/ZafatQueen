// server/controllers/userController.js

const { Op } = require('sequelize'); // لاستخدام operators مثل [Op.gt]
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../config/mailer');

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    // Sequelize: User.findOne({ where: { email } })
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
        res.status(400);
        throw new Error('المستخدم مسجل بالفعل');
    }

    // Sequelize: User.create() تعمل بنفس الطريقة
    // سيتم تشفير كلمة المرور تلقائياً بواسطة hook 'beforeCreate'
    const user = await User.create({
        username,
        email,
        password,
    });

    if (user) {
        // user.toJSON() سيتم استدعاؤها تلقائياً بواسطة res.json()
        // مما يضمن وجود حقل '_id' وحذف 'password'
        res.status(201).json({
            ...user.toJSON(), // نستخدم user.toJSON() لضمان تطابق الحقول
            token: generateToken(user.id), // نستخدم user.id وهو الـ Primary Key
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

    // Sequelize: لا نحتاج .select('+password') لأننا لم نستبعده من النموذج
    const user = await User.findOne({ where: { email } });

    // user.matchPassword هي الوظيفة التي عرفناها في النموذج
    if (user && (await user.matchPassword(password))) {
        res.json({
            ...user.toJSON(),
            token: generateToken(user.id),
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
    // Sequelize: User.findAll()
    // .toJSON() ستعمل على كل عنصر في المصفوفة تلقائياً
    const users = await User.findAll();
    res.json(users);
};

/**
 * @desc    حذف مستخدم
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
    // Sequelize: User.findByPk() للبحث بواسطة Primary Key
    const userToDelete = await User.findByPk(req.params.id);

    if (userToDelete) {
        if (userToDelete.role === 'superadmin') {
            res.status(400);
            throw new Error('لا يمكن حذف حساب السوبر أدمن.');
        }

        // req.user يأتي من middleware 'protect'
        if (req.user.id === userToDelete.id) {
            res.status(400);
            throw new Error('لا يمكنك حذف حسابك الخاص.');
        }

        // Sequelize: instance.destroy()
        await userToDelete.destroy();
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
    const userToUpdate = await User.findByPk(req.params.id);

    if (userToUpdate) {
        const allowedRoles = ['user', 'admin'];
        if (req.body.role && !allowedRoles.includes(req.body.role)) {
            res.status(400);
            throw new Error('الدور المحدد غير صالح.');
        }

        userToUpdate.role = req.body.role || userToUpdate.role;

        // Sequelize: instance.save()
        const updatedUser = await userToUpdate.save();

        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('المستخدم غير موجود');
    }
};

const forgotPassword = async (req, res) => {
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
        return res.status(200).json({ message: 'تم إرسال الإيميل إذا كان مسجلاً' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 دقائق

    // Sequelize: لتخطي التحقق نستخدم { validate: false }
    await user.save({ validate: false });

    try {
        await sendEmail({
            email: user.email,
            subject: 'إعادة تعيين كلمة المرور',
            message: `لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي لإكمال العملية: \n\n${resetToken}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`,
        });
        res.status(200).json({ message: 'تم إرسال الإيميل بنجاح' });
    } catch (error) {
        console.error(error);
        user.resetPasswordToken = null; // null في SQL بدلاً من undefined
        user.resetPasswordExpire = null;
        await user.save({ validate: false });
        res.status(500);
        throw new Error('فشل في إرسال الإيميل');
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Sequelize: استخدام Op.gt بدلاً من $gt
    const user = await User.findOne({
        where: {
            resetPasswordToken,
            resetPasswordExpire: { [Op.gt]: Date.now() },
        }
    });

    if (!user) {
        res.status(400);
        throw new Error('الرمز غير صالح أو انتهت صلاحيته');
    }

    // سيتم تشفير كلمة المرور الجديدة تلقائياً بواسطة hook 'beforeUpdate'
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
};

const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // req.user.id يأتي من middleware
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم');
    }
    
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('كلمة المرور الحالية غير صحيحة');
    }

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
    forgotPassword,
    resetPassword,
    updatePassword
};