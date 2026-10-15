const blogRepository = require("../repositories/blogRepository");

class BlogService {
  async listBlogs(query) {
    return blogRepository.paginate(query);
  }

  async getBySlug(slug, lang) {
    console.log(`🔍 Service: Finding blog by slug: ${slug}, lang: ${lang}`);
    
    const blog = await blogRepository.findBySlug(slug, lang);
    if (!blog) {
      console.log(`❌ Service: Blog not found for slug: ${slug}`);
      return null;
    }
    
    console.log(`✅ Service: Blog found`);
    return blog;
  }

  async getRelated(blog, limit) {
    return blogRepository.findRelated(blog, limit);
  }

  async incrementViews(id) {
    return blogRepository.incrementViews(id);
  }

  withFallbackTranslation(blog, lang) {
    const translations = blog.translations instanceof Map 
      ? blog.translations 
      : new Map(Object.entries(blog.translations || {}));
    const translation = translations.get(lang) || translations.get("en");
    return { ...blog.toObject(), activeTranslation: translation };
  }

  generateSlug(title) {
    if (!title) return 'untitled';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  prepareTranslations(translations) {
    if (!translations) return translations;
    
    const prepared = {};
    for (const [lang, data] of Object.entries(translations)) {
      if (data && data.title) {
        let slug = data.slug;
        if (!slug || slug.trim() === '') {
          slug = this.generateSlug(data.title);
        } else {
          // Clean the slug but preserve the text
          slug = slug
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        
        prepared[lang] = {
          title: data.title,
          slug: slug,
          excerpt: data.excerpt || '',
          content: data.content || '',
          metaTitle: data.metaTitle || data.title,
          metaDescription: data.metaDescription || (data.excerpt || '').substring(0, 160),
          seoKeywords: data.seoKeywords || [],
          videoUrl: data.videoUrl || '',
        };
      }
    }
    return prepared;
  }

  async createBlog(payload) {
    try {
      console.log("📝 Service: Creating blog...");
      
      if (payload.translations) {
        payload.translations = this.prepareTranslations(payload.translations);
      }
      
      if (!payload.featuredImage) {
        payload.featuredImage = "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
      }
      
      if (!payload.tags) {
        payload.tags = [];
      }
      
      if (!payload.status) {
        payload.status = "published";
      }
      
      const blog = await blogRepository.create(payload);
      console.log("✅ Service: Blog created successfully");
      return blog;
    } catch (error) {
      console.error("❌ Service: Error creating blog:", error);
      throw error;
    }
  }

  async updateBlog(id, payload) {
    if (payload.translations) {
      payload.translations = this.prepareTranslations(payload.translations);
    }
    return blogRepository.update(id, payload);
  }

  async deleteBlog(id) {
    return blogRepository.delete(id);
  }
}

module.exports = new BlogService();