const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Food = require('../models/Food');

const uploadDir = path.join(__dirname, '..', 'uploads');

const imagePathFromFile = (file) => `/uploads/${file.filename}`;

const deleteImageFile = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return;
  }

  const filePath = path.join(uploadDir, path.basename(imagePath));

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Could not delete image: ${filePath}`, error.message);
    }
  }
};

const deleteUploadedFile = async (file) => {
  if (file && file.filename) {
    await deleteImageFile(`/uploads/${file.filename}`);
  }
};

const isBlank = (value) => typeof value !== 'string' || value.trim().length === 0;

const hasValue = (value) => value !== undefined && value !== null && String(value).trim().length > 0;

const parsePrice = (value) => {
  if (!hasValue(value)) {
    return null;
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addFood = async (req, res, next) => {
  try {
    const { name, price, description, category } = req.body || {};

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Food image is required' });
      return;
    }

    if (isBlank(name) || isBlank(description) || !hasValue(price) || !hasValue(category)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({
        success: false,
        message: 'Food name, price, description and category are required',
      });
      return;
    }

    const numericPrice = parsePrice(price);

    if (numericPrice === null) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Price must be a valid number greater than or equal to 0' });
      return;
    }

    if (!mongoose.isValidObjectId(category)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const selectedCategory = await Category.findById(category);

    if (!selectedCategory) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Selected category does not exist' });
      return;
    }

    const food = await Food.create({
      name: name.trim(),
      price: numericPrice,
      description: description.trim(),
      category,
      image: imagePathFromFile(req.file),
    });

    await food.populate('category', 'name image');

    res.status(201).json({
      success: true,
      message: 'Food item added successfully',
      data: food,
    });
  } catch (error) {
    await deleteUploadedFile(req.file);
    next(error);
  }
};

const getFoods = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.category !== undefined) {
      if (!mongoose.isValidObjectId(req.query.category)) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      filter.category = req.query.category;
    }

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      filter.name = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
    }

    const foods = await Food.find(filter)
      .populate('category', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    next(error);
  }
};

const getFoodById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid food ID' });
      return;
    }

    const food = await Food.findById(req.params.id).populate('category', 'name image');

    if (!food) {
      res.status(404).json({ success: false, message: 'Food item not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
};

const updateFood = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Invalid food ID' });
      return;
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      await deleteUploadedFile(req.file);
      res.status(404).json({ success: false, message: 'Food item not found' });
      return;
    }

    const { name, price, description, category } = req.body || {};

    if (name !== undefined && isBlank(name)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Food name cannot be empty' });
      return;
    }

    if (description !== undefined && isBlank(description)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Food description cannot be empty' });
      return;
    }

    let numericPrice;

    if (price !== undefined) {
      numericPrice = parsePrice(price);

      if (numericPrice === null) {
        await deleteUploadedFile(req.file);
        res.status(400).json({
          success: false,
          message: 'Price must be a valid number greater than or equal to 0',
        });
        return;
      }
    }

    if (category !== undefined) {
      if (!mongoose.isValidObjectId(category)) {
        await deleteUploadedFile(req.file);
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      const selectedCategory = await Category.findById(category);

      if (!selectedCategory) {
        await deleteUploadedFile(req.file);
        res.status(400).json({ success: false, message: 'Selected category does not exist' });
        return;
      }
    }

    if (name === undefined && price === undefined && description === undefined && category === undefined && !req.file) {
      res.status(400).json({
        success: false,
        message: 'Provide a name, price, description, category or image to update',
      });
      return;
    }

    if (name !== undefined) {
      food.name = name.trim();
    }

    if (numericPrice !== undefined) {
      food.price = numericPrice;
    }

    if (description !== undefined) {
      food.description = description.trim();
    }

    if (category !== undefined) {
      food.category = category;
    }

    const previousImage = food.image;

    if (req.file) {
      food.image = imagePathFromFile(req.file);
    }

    await food.save();

    if (req.file && previousImage !== food.image) {
      await deleteImageFile(previousImage);
    }

    await food.populate('category', 'name image');

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      data: food,
    });
  } catch (error) {
    await deleteUploadedFile(req.file);
    next(error);
  }
};

const deleteFood = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid food ID' });
      return;
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      res.status(404).json({ success: false, message: 'Food item not found' });
      return;
    }

    await food.deleteOne();
    await deleteImageFile(food.image);

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully',
      data: { deletedFoodId: food._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
};
