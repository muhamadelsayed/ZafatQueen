// middleware/errorMiddleware.js

// وسيط للتعامل مع المسارات غير الموجودة (404)
const notFound = (req, res, next) => {
    const error = new Error(`غير موجود - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// وسيط شامل للتعامل مع كل الأخطاء
const errorHandler = (err, req, res, next) => {
    // أحيانًا قد يأتي الخطأ بحالة نجاح (200)، لذا نغيرها إلى خطأ خادم (500)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        // أظهر تفاصيل الخطأ فقط في وضع التطوير
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };