const express = require('express');
const {
  addFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

router.route('/').get(getFoods).post(uploadImage, addFood);

router
  .route('/:id')
  .get(getFoodById)
  .put(uploadImage, updateFood)
  .patch(uploadImage, updateFood)
  .delete(deleteFood);

module.exports = router;
