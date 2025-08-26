// config/db.js

// const mongoose = require('mongoose'); // حذف
const { Sequelize } = require('sequelize');

// إعداد الاتصال باستخدام متغيرات البيئة
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false, // يمكنك تفعيلها لوضع التطوير لرؤية استعلامات SQL
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`MySQL Connected: ${sequelize.config.host}`);
        // ملاحظة: يمكنك إضافة sequelize.sync() هنا لمزامنة النماذج مع قاعدة البيانات
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// تصدير كائن sequelize لاستخدامه في تعريف النماذج
module.exports = { connectDB, sequelize };