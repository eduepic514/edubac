// const router = require("express").Router();
// const Blog = require("../models/Blog");
// const { SUPPORTED_LANGUAGES } = require("../config/env");

// const SITE_URL = process.env.CLIENT_URL || "https://www.eduepic.com";

// /** Dynamic XML sitemap including hreflang alternates for every blog + language. */
// router.get("/sitemap.xml", async (_req, res) => {
//   const blogs = await Blog.find({ status: "published" }).select("translations updatedAt");
//   const urls = blogs
//     .map((blog) => {
//       const en = blog.translations.get("en");
//       if (!en) return "";
//       const alternates = SUPPORTED_LANGUAGES.map(
//         (lang) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}/blog/${en.slug}?lang=${lang}"/>`
//       ).join("");
//       return `<url><loc>${SITE_URL}/blog/${en.slug}</loc><lastmod>${blog.updatedAt.toISOString()}</lastmod>${alternates}</url>`;
//     })
//     .join("");

//   res.header("Content-Type", "application/xml");
//   res.send(
//     `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
//   );
// });

// router.get("/robots.txt", (_req, res) => {
//   res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`);
// });

// router.get("/rss.xml", async (_req, res) => {
//   const blogs = await Blog.find({ status: "published" }).sort({ createdAt: -1 }).limit(20);
//   const items = blogs
//     .map((blog) => {
//       const en = blog.translations.get("en");
//       if (!en) return "";
//       return `<item><title>${en.title}</title><link>${SITE_URL}/blog/${en.slug}</link><description>${en.excerpt}</description></item>`;
//     })
//     .join("");
//   res.header("Content-Type", "application/rss+xml");
//   res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>EduEpic</title><link>${SITE_URL}</link>${items}</channel></rss>`);
// });

// module.exports = router;





const router = require("express").Router();
const Blog = require("../models/Blog");
const { SUPPORTED_LANGUAGES } = require("../config/env");

const SITE_URL = "https://www.eduepic.xyz";   // ← hardcode for safety

/** Dynamic XML sitemap */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .select("translations updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    let urls = "";

    // Homepage
    urls += `
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Blog listing
    urls += `
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Static pages
    const staticPages = [
      { path: "/about", priority: "0.6" },
      { path: "/contact", priority: "0.5" },
      { path: "/faq", priority: "0.5" },
      { path: "/privacy", priority: "0.3" },
      { path: "/terms", priority: "0.3" },
    ];

    staticPages.forEach((page) => {
      urls += `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Blog posts
    blogs.forEach((blog) => {
      const translations = blog.translations instanceof Map
        ? Object.fromEntries(blog.translations)
        : blog.translations || {};

      const en = translations.en;
      if (!en || !en.slug) return;

      const lastmod = (blog.updatedAt || blog.createdAt || new Date())
        .toISOString()
        .split("T")[0];

      urls += `
  <url>
    <loc>${SITE_URL}/blog/${en.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap Error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml`);
});

module.exports = router;