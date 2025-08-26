// server/server.js

// --- 1. إعداد متغيرات البيئة (يجب أن يكون أول شيء دائمًا) ---
const dotenv = require('dotenv');
dotenv.config();

// --- 2. استيراد المكتبات الأساسية والملفات الأخرى ---
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const { sequelize, connectDB } = require('./config/db.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const { protect, isAdmin } = require('./middleware/authMiddleware.js');

// --- 3. استيراد النماذج (Models) ---
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const Settings = require('./models/settingsModel');
const Media = require('./models/mediaModel');
const CustomCss = require('./models/customCssModel');

// --- 4. تعريف العلاقات بين النماذج (Associations) ---
// يتم تعريفها هنا مركزيًا لضمان تحميلها قبل المسارات (Routes)
Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Product, { foreignKey: 'userId' });

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'CASCADE' });

Media.belongsTo(User, { foreignKey: 'uploadedBy' });
User.hasMany(Media, { foreignKey: 'uploadedBy' });

// --- 5. استيراد المسارات (Routes) ---
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes.js');
const customCssRoutes = require('./routes/customCssRoutes.js');


// --- 6. تهيئة تطبيق Express وإعدادات Middleware ---
const app = express();
app.use(express.json()); // Middleware لتحليل JSON

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
};
app.use(cors(corsOptions));
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- 7. تعريف المسارات المخصصة والـ API ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/custom-css', customCssRoutes);

// مسار جلب الملفات من مجلد uploads (لا يتأثر بقاعدة البيانات)
app.get('/api/media/files', async (req, res) => {
    try {
        await fs.access(uploadsPath);
        const allFiles = await fs.readdir(uploadsPath);

        const allMediaFiles = allFiles
            .filter(file => path.extname(file))
            .map(file => {
                const extension = path.extname(file).toLowerCase();
                let fileType = 'other';
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) fileType = 'image';
                else if (['.mp4', '.mov', '.avi', '.webm'].includes(extension)) fileType = 'video';
                else if (['.mp3', '.wav', '.ogg'].includes(extension)) fileType = 'audio';
                return { _id: file, fileName: file, fileUrl: `/uploads/${file}`, fileType };
            })
            .sort((a, b) => b.fileName.localeCompare(a.fileName));

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = allMediaFiles.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allMediaFiles.length / limit);

        res.json({ mediaFiles: paginatedFiles, page: page, pages: totalPages });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.json({ mediaFiles: [], page: 1, pages: 1 });
        }
        console.error('Error reading uploads directory:', error);
        res.status(500).json({ message: 'فشل في قراءة ملفات الوسائط' });
    }
});

// مسار حذف ملف وسائط
app.delete('/api/media/files/:filename', protect, isAdmin, async (req, res) => {
    try {
        const { filename } = req.params;
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ message: 'اسم الملف غير صالح' });
        }
        const filePath = path.join(uploadsPath, filename);
        await fs.access(filePath);
        await fs.unlink(filePath);
        res.json({ message: 'تم حذف الملف بنجاح' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'الملف غير موجود' });
        }
        console.error('Error deleting media file:', error);
        res.status(500).json({ message: 'فشل في حذف الملف' });
    }
});

// مسار اختباري
app.get('/', (req, res) => { res.send('API is running...'); });

// --- 8. معالجات الأخطاء (Middleware) ---
app.use(notFound);
app.use(errorHandler);

// --- 9. الدالة الرئيسية لتشغيل الخادم ---
const startServer = async () => {
    try {
        // الاتصال بقاعدة البيانات
        await connectDB();
        
        // مزامنة النماذج مع قاعدة البيانات
        await sequelize.sync({ alter: true });
        
        // التأكد من وجود سجل الإعدادات الافتراضي
        await Settings.initialize();

        // تشغيل خادم Express
        const PORT = process.env.PORT || 5000;
        const HOST = '0.0.0.0'; 
        app.listen(PORT, HOST, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
};

// --- 10. بدء تشغيل الخادم ---
startServer();