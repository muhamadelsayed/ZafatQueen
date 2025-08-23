// server/models/mediaModel.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    // سيتم تحديد النوع تلقائيًا بناءً على امتداد الملف
    fileType: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'other'],
        required: true,
    },
    altText: {
        type: String,
        trim: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    size: {
        type: Number, // حجم الملف بالبايت
    },
}, {
    timestamps: true,
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;