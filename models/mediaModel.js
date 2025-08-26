// models/mediaModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Media = sequelize.define('Media', {
    // id (Primary Key) يُضاف تلقائياً
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['image', 'video', 'audio', 'document', 'other']],
                msg: "نوع الملف غير صالح"
            }
        }
    },
    altText: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    // --- Foreign Key (بديل عن Mongoose 'ref') ---
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // اسم جدول المستخدمين
            key: 'id',
        }
    }
}, {
    // --- خيارات النموذج ---
    timestamps: true,
    // Sequelize بشكل افتراضي سيسمي الجدول 'Media'
});

// وظيفة لتعديل شكل الـ JSON الخارج ليتوافق مع الـ API القديم (_id)
Media.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id; // أضف حقل _id
    delete values.id;       // احذف الحقل الأصلي

    return values;
};

module.exports = Media;