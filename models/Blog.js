// const mongoose = require("mongoose");

// /**
//  * Each blog stores one sub-document per language inside `translations`.
//  * Adding a new language never requires a schema migration — just start
//  * writing to `translations.<newLangCode>`.
//  */
// const translationSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     slug: { type: String, required: true, index: true },
//     excerpt: { type: String, required: true },
//     content: { type: String, required: true },
//     metaTitle: { type: String },
//     metaDescription: { type: String },
//     seoKeywords: [{ type: String }],
//   },
//   { _id: false }
// );

// const blogSchema = new mongoose.Schema(
//   {
//     category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
//     tags: [{ type: String, index: true }],
//     featuredImage: { type: String, required: true },
//     author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     featured: { type: Boolean, default: false },
//     status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
//     views: { type: Number, default: 0 },
//     translations: {
//       type: Map,
//       of: translationSchema,
//       required: true,
//       validate: {
//         validator: (map) => map.has("en"),
//         message: "English (en) translation is required as the fallback language.",
//       },
//     },
//   },
//   { timestamps: true }
// );

// blogSchema.index({ "translations.$**.slug": 1 });

// // ❌ NO MIDDLEWARE HERE - We handle everything in service layer

// module.exports = mongoose.model("Blog", blogSchema);


const mongoose = require("mongoose");

const translationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    seoKeywords: [{ type: String }],
    videoUrl: { type: String, default: "" }, // ← added
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    tags: [{ type: String, index: true }],
    featuredImage: { type: String, required: true },
    videoUrl: { type: String, default: "" }, // ← top-level also
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    views: { type: Number, default: 0 },
    translations: {
      type: Map,
      of: translationSchema,
      required: true,
      validate: {
        validator: (map) => map.has("en"),
        message: "English (en) translation is required as the fallback language.",
      },
    },
  },
  { timestamps: true }
);

blogSchema.index({ "translations.$**.slug": 1 });

module.exports = mongoose.model("Blog", blogSchema);