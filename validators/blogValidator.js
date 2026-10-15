const Joi = require("joi");

const translationSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().allow('', null),
  excerpt: Joi.string().allow('', null),
  content: Joi.string().required(),
  metaTitle: Joi.string().allow('', null),
  metaDescription: Joi.string().allow('', null),
  seoKeywords: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
    Joi.any()
  ),
  videoUrl: Joi.string().allow('', null),
});

// ✅ Allow unknown fields and parse translations
exports.createBlogSchema = Joi.object({
  category: Joi.string().required(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
    Joi.any()
  ),
  featuredImage: Joi.string().allow('', null),
  videoUrl: Joi.string().allow('', null),
  author: Joi.string().required(),
  featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string(),
    Joi.number(),
    Joi.any()
  ),
  status: Joi.string().valid("draft", "published", "archived").default("published"),
  translations: Joi.alternatives().try(
    Joi.object({
      en: translationSchema.required()
    }).unknown(true),
    Joi.string()
  ).required(),
}).unknown(true);  // ✅ Allow extra fields like image, video

exports.updateBlogSchema = Joi.object({
  category: Joi.string(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
    Joi.any()
  ),
  featuredImage: Joi.string().allow('', null),
  videoUrl: Joi.string().allow('', null),
  featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string(),
    Joi.number(),
    Joi.any()
  ),
  status: Joi.string().valid("draft", "published", "archived"),
  translations: Joi.alternatives().try(
    Joi.object({
      en: translationSchema
    }).unknown(true),
    Joi.string()
  ),
}).unknown(true);