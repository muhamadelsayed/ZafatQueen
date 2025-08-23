// routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

const { protect } = require('../middleware/authMiddleware'); // سنحمي المسارات الحساسة

router.route('/')
    .post(protect, createCategory)
    .get(getAllCategories);

router.route('/:id')
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

module.exports = router;