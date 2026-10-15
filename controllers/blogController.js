const blogService = require("../services/blogService");
const { successResponse } = require("../utils/apiResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

/** Convert Mongoose doc / Map translations into plain JSON-safe object */
const toPlainBlog = (blog) => {
  if (!blog) return null;

  const obj = typeof blog.toObject === "function" ? blog.toObject() : { ...blog };

  // translations Map → plain object
  if (obj.translations instanceof Map) {
    obj.translations = Object.fromEntries(obj.translations);
  }

  // stable id
  obj.id = obj._id?.toString?.() || obj.id;

  // categorySlug for frontend
  if (obj.category && typeof obj.category === "object") {
    obj.categorySlug = obj.category.slug || obj.categorySlug;
  }

  // author shape for frontend
  if (obj.author && typeof obj.author === "object") {
    obj.author = {
      name: obj.author.name || "Unknown",
      avatar: obj.author.avatar || "",
      bio: obj.author.bio || "",
      id: obj.author._id?.toString?.() || obj.author.id,
    };
  } else if (!obj.author) {
    obj.author = { name: "Unknown", avatar: "", bio: "" };
  }

  // publishedAt fallback (schema uses timestamps)
  if (!obj.publishedAt) {
    obj.publishedAt = obj.createdAt || obj.updatedAt || null;
  }

  return obj;
};

exports.getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 6, category, tag, search, featured } = req.query;
  const lang = req.headers["accept-language"] || "en";

  const result = await blogService.listBlogs({
    page: Number(page),
    pageSize: Number(pageSize),
    category,
    tag,
    search,
    featured: featured !== undefined ? featured === "true" : undefined,
    lang,
  });

  // normalize each blog for frontend
  const data = (result.data || []).map(toPlainBlog);

  return successResponse(res, {
    ...result,
    data,
  });
});

exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const lang = req.headers["accept-language"] || "en";

  console.log(`🔍 Looking for blog with slug: "${slug}" in language: "${lang}"`);

  if (!slug) {
    return res.status(400).json({ success: false, message: "Slug is required" });
  }

  let blog = await blogService.getBySlug(slug, lang);

  // Case-insensitive fallback
  if (!blog) {
    console.log(`⚠️ Trying case-insensitive search for: "${slug}"`);
    const allBlogs = await blogService.listBlogs({ page: 1, pageSize: 200 });
    if (allBlogs?.data) {
      blog = allBlogs.data.find((b) => {
        const translations =
          b.translations instanceof Map
            ? Object.fromEntries(b.translations)
            : b.translations || {};
        return Object.values(translations).some(
          (trans) =>
            trans &&
            trans.slug &&
            String(trans.slug).toLowerCase() === slug.toLowerCase()
        );
      });
    }
  }

  if (!blog) {
    console.log(`❌ Blog not found for slug: "${slug}"`);
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  await blogService.incrementViews(blog._id || blog.id);
  const relatedRaw = await blogService.getRelated(blog, 3);

  const responseData = toPlainBlog(blog);
  const related = (relatedRaw || []).map(toPlainBlog);

  console.log("✅ Blog response image:", responseData.featuredImage);
  console.log("✅ Blog response video:", responseData.videoUrl);
  console.log("✅ Blog response author:", responseData.author?.name);
  console.log("✅ Blog response date:", responseData.publishedAt);

  return successResponse(res, { blog: responseData, related });
});

exports.createBlog = asyncHandler(async (req, res) => {
  try {
    let { category, translations, author, tags, featuredImage, videoUrl, featured, status } =
      req.body;

    console.log("📝 Raw body:", JSON.stringify(req.body, null, 2));
    console.log("📁 Files received:", req.files);

    // Parse translations (FormData sends string)
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid translations format" });
      }
    }

    // Parse tags
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
    if (!Array.isArray(tags)) tags = [];

    // Validate
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    if (!translations?.en) {
      return res.status(400).json({ success: false, message: "English translation is required" });
    }
    if (!translations.en.title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!translations.en.content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    // Author
    let authorId = author;
    if (
      author === "admin" ||
      author === "admin@eduepic.com" ||
      !mongoose.Types.ObjectId.isValid(author)
    ) {
      const User = require("../models/User");
      const adminUser = await User.findOne({ email: "eduepic72@gmail.com" });
      if (!adminUser) {
        return res.status(400).json({ success: false, message: "Admin user not found" });
      }
      authorId = adminUser._id;
      console.log(`✅ Author resolved to: ${adminUser.name} (${adminUser._id})`);
    }

    // Category
    const Category = require("../models/Category");
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    // Files → correct public URLs
    let finalFeaturedImage = featuredImage || "";
    let finalVideoUrl = videoUrl || "";

    if (req.files?.image?.[0]) {
      finalFeaturedImage = `/uploads/images/${req.files.image[0].filename}`;
      console.log("✅ Image URL stored:", finalFeaturedImage);
    }
    if (req.files?.video?.[0]) {
      finalVideoUrl = `/uploads/videos/${req.files.video[0].filename}`;
      console.log("✅ Video URL stored:", finalVideoUrl);
    }

    if (!finalFeaturedImage) {
      finalFeaturedImage =
        "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
    }

    // Slug
    let finalSlug = translations.en.slug;
    if (!finalSlug || !String(finalSlug).trim()) {
      finalSlug = translations.en.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    } else {
      finalSlug = String(finalSlug)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const isFeatured =
      featured === "true" || featured === true || featured === 1 || featured === "1";

    const blogData = {
      category,
      tags,
      featuredImage: finalFeaturedImage,
      videoUrl: finalVideoUrl || "",
      author: authorId,
      featured: isFeatured,
      status: status || "published",
      translations: {
        en: {
          title: translations.en.title,
          slug: finalSlug,
          excerpt: translations.en.excerpt || "",
          content: translations.en.content,
          metaTitle: translations.en.metaTitle || translations.en.title,
          metaDescription:
            translations.en.metaDescription ||
            String(translations.en.excerpt || "").substring(0, 160),
          seoKeywords: translations.en.seoKeywords || [],
          videoUrl: finalVideoUrl || "",
        },
      },
    };

    console.log("📤 Final blog data:", JSON.stringify(blogData, null, 2));

    const blog = await blogService.createBlog(blogData);
    const plain = toPlainBlog(blog);

    console.log(`✅ Blog created with slug: "${finalSlug}"`);
    return successResponse(res, plain, "Blog created successfully", 201);
  } catch (error) {
    console.error("❌ Error in createBlog:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

exports.updateBlog = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    console.log("📁 Files for update:", req.files);

    let translations = req.body.translations;
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
        req.body.translations = translations;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid translations format" });
      }
    }

    let authorId = req.body.author;
    if (
      authorId === "admin" ||
      authorId === "admin@eduepic.com" ||
      (authorId && !mongoose.Types.ObjectId.isValid(authorId))
    ) {
      const User = require("../models/User");
      const adminUser = await User.findOne({ email: "eduepic72@gmail.com" });
      if (adminUser) authorId = adminUser._id;
    }

    // Start from existing body values (keep old if no new file)
    let finalFeaturedImage = req.body.featuredImage;
    let finalVideoUrl = req.body.videoUrl;

    if (req.files?.image?.[0]) {
      finalFeaturedImage = `/uploads/images/${req.files.image[0].filename}`;
      console.log("✅ Image URL for update:", finalFeaturedImage);
    }
    if (req.files?.video?.[0]) {
      finalVideoUrl = `/uploads/videos/${req.files.video[0].filename}`;
      console.log("✅ Video URL for update:", finalVideoUrl);
    }

    if (req.body.translations?.en) {
      const en = req.body.translations.en;
      if (en.slug && String(en.slug).trim()) {
        en.slug = String(en.slug)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      if (finalVideoUrl) en.videoUrl = finalVideoUrl;
    }

    const blogData = {
      ...req.body,
      author: authorId,
    };

    // Only overwrite media fields when we have a real value
    if (finalFeaturedImage) blogData.featuredImage = finalFeaturedImage;
    if (finalVideoUrl !== undefined && finalVideoUrl !== null) {
      blogData.videoUrl = finalVideoUrl;
    }

    const blog = await blogService.updateBlog(id, blogData);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    return successResponse(res, toPlainBlog(blog), "Blog updated successfully");
  } catch (error) {
    console.error("❌ Error in updateBlog:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid blog ID" });
  }

  const blog = await blogService.deleteBlog(id);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  return successResponse(res, null, "Blog deleted successfully");
});

exports.incrementViews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await blogService.incrementViews(id);
  return successResponse(res, null, "Views updated");
});