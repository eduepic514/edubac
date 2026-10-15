const mongoose = require("mongoose");

const categoryTranslationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "📁" }, // emoji fallback
    image: { type: String, default: "" }, // URL or /uploads/images/...
    translations: {
      type: Map,
      of: categoryTranslationSchema,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);