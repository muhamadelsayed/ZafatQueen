// models/customCssModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CustomCss = sequelize.define('CustomCss', {
    // id (Primary Key) يُضاف تلقائياً
    path: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // كل مسار يجب أن يكون فريدًا
        comment: 'e.g., /about, /product/:id, or /'
    },
    css: {
        type: DataTypes.TEXT('long'), // TEXT لاستيعاب كود CSS طويل
        allowNull: false,
    }
}, {
    timestamps: true,
});

// وظيفة لتعديل شكل الـ JSON الخارج
CustomCss.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    delete values.id;
    return values;
};

module.exports = CustomCss;