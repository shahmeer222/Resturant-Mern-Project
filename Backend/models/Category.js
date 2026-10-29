const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
      maxlength: [1000, 'Category description cannot exceed 1000 characters'],
    },
    image: {
      type: String,
      required: [true, 'Category image is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
