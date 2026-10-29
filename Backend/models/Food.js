const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [100, 'Food name cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Food price is required'],
      min: [0, 'Food price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Food description is required'],
      trim: true,
      maxlength: [1000, 'Food description cannot exceed 1000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Food category is required'],
      index: true,
    },
    image: {
      type: String,
      required: [true, 'Food image is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

foodSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Food', foodSchema);
