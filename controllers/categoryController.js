const Category = require("../models/Category");
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const mongoose = require("mongoose");

const toPlainCategory = (cat) => {
  if (!cat) return null;
  const obj = typeof cat.toObject === "function" ? cat.toObject() : { ...cat };
  if (obj.translations instanceof Map) {
    obj.translations = Object.fromEntries(obj.translations);
  }
  obj.id = obj._id?.toString?.() || obj.id;
  return obj;
};

exports.getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: 1 });
  return successResponse(res, categories.map(toPlainCategory));
});

exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return successResponse(res, toPlainCategory(category));
});

exports.createCategory = asyncHandler(async (req, res) => {
  let { slug, icon, image, translations } = req.body;

  // FormData may send translations as string
  if (typeof translations === "string") {
    try {
      translations = JSON.parse(translations);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid translations" });
    }
  }

  if (!slug) {
    return res.status(400).json({ success: false, message: "Slug is required" });
  }

  const existing = await Category.findOne({ slug });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Category with this slug already exists",
    });
  }

  // PC upload wins over URL
  let finalImage = image || "";
  if (req.files?.image?.[0]) {
    finalImage = `/uploads/images/${req.files.image[0].filename}`;
  }

  const category = await Category.create({
    slug,
    icon: icon || "📁",
    image: finalImage,
    translations: translations || { en: { name: slug, description: "" } },
  });

  return successResponse(res, toPlainCategory(category), "Category created", 201);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }

  let { slug, icon, image, translations } = req.body;

  if (typeof translations === "string") {
    try {
      translations = JSON.parse(translations);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid translations" });
    }
  }

  let finalImage = image;
  if (req.files?.image?.[0]) {
    finalImage = `/uploads/images/${req.files.image[0].filename}`;
  }

  const update = {};
  if (slug) update.slug = slug;
  if (icon !== undefined) update.icon = icon;
  if (finalImage !== undefined && finalImage !== "") update.image = finalImage;
  if (translations) update.translations = translations;

  const category = await Category.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return successResponse(res, toPlainCategory(category), "Category updated");
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return successResponse(res, null, "Category deleted");
});