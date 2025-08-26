// --- 1. استيراد المكتبات الأساسية ---
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

// --- 2. إعدادات البيئة والتطبيق ---
dotenv.config();
const app = express();
app.use(express.json());

// --- 3. استيراد الاتصال بقاعدة البيانات و Sequelize ---
// تم التعديل ليناسب sequelize
const { connectDB, sequelize } = require('./config/db.js');

// --- 4. استيراد جميع نماذج Sequelize ---
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const Settings = require('./models/settingsModel');
const Media = require('./models/mediaModel');

// --- 5. استيراد جميع ملفات المسارات (Routes) ---
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes.js');


// --- 6. إعدادات CORS والملفات الثابتة (Static Files) ---
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
};
app.use(cors(corsOptions));

const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));


// --- 7. تعريف المسارات الرئيسية للتطبيق (API Routes) ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadRoutes);

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

        res.json({
            mediaFiles: paginatedFiles,
            page: page,
            pages: totalPages,
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.json({ mediaFiles: [], page: 1, pages: 1 });
        }
        console.error('Error reading uploads directory:', error);
        res.status(500).json({ message: 'فشل في قراءة ملفات الوسائط' });
    }
});

// --- مسار اختباري ---
app.get('/', (req, res) => { res.send('API is running...'); });


// --- 8. معالجات الأخطاء (يجب أن تكون في النهاية قبل تشغيل الخادم) ---
app.use(notFound);
app.use(errorHandler);


// --- 9. الدالة الرئيسية لتشغيل الخادم ---
const startServer = async () => {
    try {
        // أولاً: الاتصال بقاعدة البيانات
        await connectDB();
        console.log("Database connection has been established successfully.");

        // ثانياً: تعريف العلاقات بين النماذج
        // علاقة المستخدم بالمنتجات
        Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        User.hasMany(Product, { foreignKey: 'userId' });

        // علاقة القسم بالمنتجات (مع الحذف المتتالي)
        Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
        Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'CASCADE' });

        // علاقة المستخدم بالوسائط
        Media.belongsTo(User, { foreignKey: 'uploadedBy' });
        User.hasMany(Media, { foreignKey: 'uploadedBy' });
        
        console.log("All model associations have been defined.");

        // ثالثاً: مزامنة النماذج مع قاعدة البيانات
        // هذا السطر سيقوم بإنشاء الجداول تلقائياً إذا لم تكن موجودة
        await sequelize.sync({ alter: true }); // استخدم { alter: true } في وضع التطوير
        console.log("All models were synchronized successfully.");

        // رابعاً: التأكد من وجود سجل الإعدادات الافتراضي
        await Settings.initialize();

        // خامساً: تشغيل خادم Express
        const PORT = process.env.PORT || 5000;
        const HOST = '0.0.0.0'; 
        app.listen(PORT, HOST, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
};

// --- 10. بدء تشغيل الخادم ---
startServer();