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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findDuplicateCategory = (name, excludedId) => {
  const query = { name: name.trim() };

  if (excludedId) {
    query._id = { $ne: excludedId };
  }

  return Category.findOne(query);
};

const addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Category image is required' });
      return;
    }

    if (isBlank(name) || isBlank(description)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Category name and description are required' });
      return;
    }

    const duplicate = await findDuplicateCategory(name);

    if (duplicate) {
      await deleteUploadedFile(req.file);
      res.status(409).json({ success: false, message: 'A category with this name already exists' });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description.trim(),
      image: imagePathFromFile(req.file),
    });

    res.status(201).json({
      success: true,
      message: 'Category added successfully',
      data: category,
    });
  } catch (error) {
    await deleteUploadedFile(req.file);
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const filter = {};

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      filter.name = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
    }

    const categories = await Category.find(filter).sort({ createdAt: -1 }).lean();
    const foodCounts = await Food.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(foodCounts.map((item) => [String(item._id), item.count]));
    const data = categories.map((category) => ({
      ...category,
      foodCount: countMap.get(String(category._id)) || 0,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const category = await Category.findById(req.params.id).lean();

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const foodCount = await Food.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      data: { ...category, foodCount },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      await deleteUploadedFile(req.file);
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const { name, description } = req.body;
    const hasName = typeof name === 'string' && name.trim().length > 0;
    const hasDescription = typeof description === 'string' && description.trim().length > 0;

    if (name !== undefined && !hasName) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Category name cannot be empty' });
      return;
    }

    if (description !== undefined && !hasDescription) {
      await deleteUploadedFile(req.file);
      res.status(400).json({ success: false, message: 'Category description cannot be empty' });
      return;
    }

    if (!hasName && !hasDescription && !req.file) {
      res.status(400).json({ success: false, message: 'Provide a name, description or image to update' });
      return;
    }

    if (hasName) {
      const duplicate = await findDuplicateCategory(name, category._id);

      if (duplicate) {
        await deleteUploadedFile(req.file);
        res.status(409).json({ success: false, message: 'A category with this name already exists' });
        return;
      }

      category.name = name.trim();
    }

    if (hasDescription) {
      category.description = description.trim();
    }

    const previousImage = category.image;

    if (req.file) {
      category.image = imagePathFromFile(req.file);
    }

    await category.save();

    if (req.file && previousImage !== category.image) {
      await deleteImageFile(previousImage);
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    await deleteUploadedFile(req.file);
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const foods = await Food.find({ category: category._id }).select('image').lean();

    await Promise.all(foods.map((food) => deleteImageFile(food.image)));
    await Food.deleteMany({ category: category._id });
    await category.deleteOne();
    await deleteImageFile(category.image);

    res.status(200).json({
      success: true,
      message: 'Category and its food items deleted successfully',
      data: {
        deletedCategoryId: category._id,
        deletedFoodCount: foods.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
