// models/productModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    // id (Primary Key) يُضاف تلقائياً

    // --- الحقول الأساسية ---
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'الرجاء إدخال اسم المنتج'
            }
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'صورة المنتج حقل مطلوب'
            }
        }
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('images');
            if (!rawValue) {
                return [];
            }
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return [];
                }
            }
            return rawValue;
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'الرجاء إدخال وصف المنتج'
            }
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            notNull: {
                msg: 'الرجاء إدخال السعر الحالي للمنتج'
            }
        }
    },
    originalPrice: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    countInStock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    isVirtual: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    executionTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // --- Foreign Keys ---
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        }
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Categories',
            key: 'id',
        }
    }
}, {
    // --- خيارات النموذج ---
    timestamps: true,
    hooks: {
        beforeValidate: (product) => {
            if (product.isVirtual === false) {
                if (product.countInStock === null || typeof product.countInStock === 'undefined') {
                    throw new Error('حقل الكمية المتوفرة مطلوب للمنتجات غير الافتراضية.');
                }
            } else {
                product.countInStock = null;
            }
        }
    }
});

// وظيفة لتعديل شكل الـ JSON الخارج ليتوافق مع الـ API القديم
Product.prototype.toJSON = function () {
    const values = { ...this.get() };

    // 1. تحويل id إلى _id
    values._id = values.id;
    delete values.id;

    // 2. إعادة تسمية userId إلى user
    if (values.userId) {
        values.user = values.userId;
        delete values.userId;
    }

    // --- **الإصلاح الرئيسي هنا** ---
    // 3. التعامل بذكاء مع حقل القسم
    // لا تقم باستبدال كائن 'category' إذا كان موجودًا بالفعل (من include).
    // إذا لم يكن موجودًا، استخدم الـ ID كقيمة احتياطية.
    if (values.categoryId && !values.category) {
        values.category = values.categoryId;
    }
    // احذف دائمًا categoryId لتجنب التكرار في الـ JSON.
    delete values.categoryId;
    // --- **نهاية الإصلاح** ---

    return values;
};

module.exports = Product;