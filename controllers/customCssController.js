// controllers/customCssController.js
const CustomCss = require('../models/customCssModel');

// @desc    جلب كل قواعد الـ CSS (للادمن)
// @route   GET /api/custom-css
// @access  Private/Admin
exports.getAllCssRules = async (req, res) => {
    const rules = await CustomCss.findAll({ order: [['path', 'ASC']] });
    res.json(rules);
};

// @desc    جلب كل قواعد الـ CSS (للعرض العام)
// @route   GET /api/custom-css/public
// @access  Public
exports.getPublicCssRules = async (req, res) => {
    const rules = await CustomCss.findAll({ attributes: ['path', 'css'] });
    res.json(rules);
};

// @desc    إنشاء أو تحديث قاعدة CSS (Upsert)
// @route   POST /api/custom-css
// @access  Private/Admin
exports.saveCssRule = async (req, res) => {
    let { path, css } = req.body; // <-- غيرنا const إلى let
    if (!path || !css) {
        res.status(400);
        throw new Error('المسار وكود الـ CSS حقول مطلوبة');
    }

    // --- **الإصلاح الرئيسي هنا: تنظيف المسار قبل الحفظ** ---
    // 1. إزالة المسافات الزائدة من البداية والنهاية
    path = path.trim();
    // 2. التأكد من أن المسار يبدأ بـ /
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    // 3. إزالة أي / في النهاية (إذا كان المسار أطول من /)
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    // --- **نهاية الإصلاح** ---

    const [rule, created] = await CustomCss.findOrCreate({
        where: { path },
        defaults: { path, css } // <-- تأكد من تمرير المسار النظيف هنا أيضًا
    });

    if (!created) {
        rule.css = css;
        await rule.save();
    }

    res.status(201).json(rule);
};


// @desc    حذف قاعدة CSS
// @route   DELETE /api/custom-css/:id
// @access  Private/Admin
exports.deleteCssRule = async (req, res) => {
    const rule = await CustomCss.findByPk(req.params.id);
    if (rule) {
        await rule.destroy();
        res.json({ message: 'تم حذف القاعدة بنجاح' });
    } else {
        res.status(404);
        throw new Error('القاعدة غير موجودة');
    }
};