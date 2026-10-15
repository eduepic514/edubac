const Blog = require("../models/Blog");

class BlogRepository {
  async paginate({ page = 1, pageSize = 6, category, tag, search, featured, lang = "en" }) {
    try {
      const filter = { status: "published" };
      
      if (category) {
        if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
          const Category = require("../models/Category");
          const cat = await Category.findOne({ slug: category });
          if (cat) {
            filter.category = cat._id;
          }
        } else {
          filter.category = category;
        }
      }
      
      if (tag) filter.tags = tag;
      if (featured !== undefined) filter.featured = featured;
      
      if (search) {
        filter.$or = [
          { [`translations.${lang}.title`]: { $regex: search, $options: "i" } },
          { [`translations.en.title`]: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }

      const total = await Blog.countDocuments(filter);
      const data = await Blog.find(filter)
        .populate("category", "slug translations icon")
        .populate("author", "name avatar bio")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return { 
        data, 
        total, 
        page, 
        pageSize, 
        totalPages: Math.max(1, Math.ceil(total / pageSize)) 
      };
    } catch (error) {
      console.error("❌ Error in paginate:", error);
      throw error;
    }
  }

  async findBySlug(slug, lang = "en") {
    try {
      console.log(`🔍 Finding by slug: ${slug}, lang: ${lang}`);
      
      if (!slug) return null;
      
      let blog = null;
      
      // Try exact match in requested language
      let query = { [`translations.${lang}.slug`]: slug };
      blog = await Blog.findOne(query)
        .populate("category", "slug translations icon")
        .populate("author", "name avatar bio");
      
      // Try English
      if (!blog && lang !== "en") {
        query = { [`translations.en.slug`]: slug };
        blog = await Blog.findOne(query)
          .populate("category", "slug translations icon")
          .populate("author", "name avatar bio");
      }
      
      // Case-insensitive search
      if (!blog) {
        const allBlogs = await Blog.find({})
          .populate("category", "slug translations icon")
          .populate("author", "name avatar bio");
        
        blog = allBlogs.find(b => {
          const translations = b.translations;
          if (!translations) return false;
          for (const [langCode, trans] of translations) {
            if (trans && trans.slug && trans.slug.toLowerCase() === slug.toLowerCase()) {
              return true;
            }
          }
          return false;
        });
      }
      
      // Try by ID
      if (!blog && slug.match(/^[0-9a-fA-F]{24}$/)) {
        blog = await Blog.findById(slug)
          .populate("category", "slug translations icon")
          .populate("author", "name avatar bio");
      }
      
      if (blog) {
        console.log(`✅ Found blog: ${blog.translations?.get('en')?.title || 'Untitled'}`);
      } else {
        console.log(`❌ No blog found for slug: ${slug}`);
      }
      
      return blog;
    } catch (error) {
      console.error("❌ Error in findBySlug:", error);
      throw error;
    }
  }

  findRelated(blog, limit = 3) {
    return Blog.find({ 
      _id: { $ne: blog._id }, 
      category: blog.category, 
      status: "published" 
    })
    .populate("category", "slug translations icon")
    .populate("author", "name avatar bio")
    .limit(limit);
  }

  async create(payload) {
    try {
      console.log("📝 Repository: Creating blog...");
      
      // ✅ Convert translations to Map if needed
      if (payload.translations && typeof payload.translations === 'object' && !(payload.translations instanceof Map)) {
        const map = new Map();
        for (const [key, value] of Object.entries(payload.translations)) {
          map.set(key, value);
        }
        payload.translations = map;
      }
      
      // ✅ Create blog directly
      const blog = new Blog(payload);
      await blog.save();
      
      console.log("✅ Repository: Blog saved successfully:", blog._id);
      return blog;
    } catch (error) {
      console.error("❌ Repository: Error creating blog:", error);
      console.error("❌ Stack:", error.stack);
      throw error;
    }
  }

  async update(id, payload) {
    try {
      if (payload.translations && typeof payload.translations === 'object' && !(payload.translations instanceof Map)) {
        const map = new Map();
        for (const [key, value] of Object.entries(payload.translations)) {
          map.set(key, value);
        }
        payload.translations = map;
      }
      
      const blog = await Blog.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
      return blog;
    } catch (error) {
      console.error("❌ Repository: Error updating blog:", error);
      throw error;
    }
  }

  async delete(id) {
    return Blog.findByIdAndDelete(id);
  }

  async incrementViews(id) {
    return Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }
}

module.exports = new BlogRepository();