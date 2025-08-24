// server/server.js
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

// استيراد جميع ملفات المسارات
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes.js');

const Settings = require('./models/settingsModel');

// --- إعدادات أولية ---
dotenv.config();
connectDB(); // استدعاء دالة الاتصال بقاعدة البيانات

const app = express();

// ====================================================================
// **الإصلاح الرئيسي هنا: إعدادات CORS المخصصة للإنتاج**
// ====================================================================
// قائمة النطاقات المسموح لها بالوصول
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false, // credentials must be false when origin is '*'
};

app.use(cors(corsOptions));
app.use(express.json());

// **تعديل بسيط لضمان المسار الصحيح على Railway**
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// مسار جلب الملفات من مجلد uploads مع الترقيم
app.get('/api/media/files', async (req, res) => {
    try {
        // التأكد من وجود المجلد قبل محاولة قراءته
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
        // إذا لم يكن المجلد موجودًا، أعد مصفوفة فارغة بدلاً من خطأ
        if (error.code === 'ENOENT') {
            return res.json({ mediaFiles: [], page: 1, pages: 1 });
        }
        console.error('Error reading uploads directory:', error);
        res.status(500).json({ message: 'فشل في قراءة ملفات الوسائط' });
    }
});

// --- تعريف المسارات الرئيسية للتطبيق ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadRoutes);

// --- مسار اختباري ---
app.get('/', (req, res) => { res.send('API is running...'); });

// --- معالجات الأخطاء ---
app.use(notFound);
app.use(errorHandler);

// --- تشغيل الخادم ---
const PORT = process.env.PORT || 5000; // Railway قد تفضل بورت مختلف
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});