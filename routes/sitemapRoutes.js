const router = require("express").Router();
const Blog = require("../models/Blog");
const { SUPPORTED_LANGUAGES } = require("../config/env");

// Your canonical frontend domain
const SITE_URL = (
  process.env.SITE_URL || "https://www.eduepic.xyz"
).replace(/\/+$/, "");

// Escape special XML characters
const escapeXML = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// Encode individual URL path segments
const encodeSlug = (slug) => encodeURIComponent(String(slug));

// Get translations from the MongoDB Map
const getTranslation = (translations, language) => {
  return translations?.get(language) || null;
};

// Generate sitemap
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const blogs = await Blog.find({
      status: "published",
    })
      .select("translations updatedAt createdAt")
      .sort({ updatedAt: -1 });

    const urls = [];

    // Important public website pages (NO admin/login)
    const staticPages = [
      "/",
      "/blog",
      "/categories",
      "/about",
      "/contact",
      "/faq",
      "/privacy",
      "/terms",
    ];

    staticPages.forEach((path) => {
      urls.push(`
        <url>
          <loc>${escapeXML(`${SITE_URL}${path}`)}</loc>
          <changefreq>weekly</changefreq>
          <priority>${path === "/" ? "1.0" : "0.8"}</priority>
        </url>
      `);
    });

    // Published blog articles
    for (const blog of blogs) {
      const translations = blog.translations;
      const english = getTranslation(translations, "en");

      // English translation is required
      if (!english?.slug) continue;

      const englishUrl = `${SITE_URL}/blog/${encodeSlug(english.slug)}`;

      // Include only languages with actual translations
      const availableLanguages = (SUPPORTED_LANGUAGES || ["en"]).filter(
        (language) => {
          return Boolean(getTranslation(translations, language)?.slug);
        }
      );

      // Hreflang alternate links
      const alternates = availableLanguages
        .map((language) => {
          const languageUrl =
            language === "en"
              ? englishUrl
              : `${englishUrl}?lang=${encodeURIComponent(language)}`;

          return `
          <xhtml:link
            rel="alternate"
            hreflang="${escapeXML(language)}"
            href="${escapeXML(languageUrl)}"
          />
        `;
        })
        .join("");

      // x-default points to English
      const defaultAlternate = `
        <xhtml:link
          rel="alternate"
          hreflang="x-default"
          href="${escapeXML(englishUrl)}"
        />
      `;

      const lastModified = blog.updatedAt || blog.createdAt;

      urls.push(`
        <url>
          <loc>${escapeXML(englishUrl)}</loc>
          ${
            lastModified
              ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>`
              : ""
          }
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
          ${alternates}
          ${defaultAlternate}
        </url>
      `);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls.join("")}
</urlset>`;

    res.status(200);
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");
    return res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return res
      .status(500)
      .type("text/plain")
      .send("Unable to generate sitemap");
  }
});

// Robots.txt
router.get("/robots.txt", (_req, res) => {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res.status(200).type("text/plain").send(robots);
});

// RSS feed
router.get("/rss.xml", async (_req, res) => {
  try {
    const blogs = await Blog.find({
      status: "published",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("translations createdAt");

    const items = blogs
      .map((blog) => {
        const english = getTranslation(blog.translations, "en");

        if (!english?.slug) return "";

        const url = `${SITE_URL}/blog/${encodeSlug(english.slug)}`;

        return `
        <item>
          <title>${escapeXML(english.title || "")}</title>
          <link>${escapeXML(url)}</link>
          <description>${escapeXML(english.excerpt || "")}</description>
          <pubDate>${new Date(blog.createdAt).toUTCString()}</pubDate>
        </item>
      `;
      })
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>EduEpic</title>
    <link>${SITE_URL}</link>
    <description>Global scholarships, admissions and student resources.</description>
    ${items}
  </channel>
</rss>`;

    res.status(200).type("application/rss+xml").send(rss);
  } catch (error) {
    console.error("RSS generation error:", error);

    res.status(500).type("text/plain").send("Unable to generate RSS feed");
  }
});

module.exports = router;