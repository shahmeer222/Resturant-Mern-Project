const express = require('express');
const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

router.route('/').get(getCategories).post(uploadImage, addCategory);

router
  .route('/:id')
  .get(getCategoryById)
  .put(uploadImage, updateCategory)
  .patch(uploadImage, updateCategory)
  .delete(deleteCategory);

module.exports = router;
