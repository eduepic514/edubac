/**
 * EduEpic Backend — Application Entry Point
 * Node.js + Express + MongoDB (Mongoose)
 *
 * This file wires together security middlewares, routes and error handling.
 * Run with: node server.js (after `npm install` inside /backend)
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const dns = require("dns");

const { connectDatabase } = require("./config/db");
const { PORT, CLIENT_URL } = require("./config/env");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const commentRoutes = require("./routes/commentRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const contactRoutes = require("./routes/contactRoutes");
const sitemapRoutes = require("./routes/sitemapRoutes");

// ✅ DNS Servers set karein (Atlas connection ke liye)

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// --- Global Middlewares ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}

));
app.use(compression());
app.use(morgan("combined"));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);


// ✅ Serve uploaded files statically - MAKE SURE THIS EXISTS

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Static files served from:', path.join(__dirname, 'uploads'));

// --- API Routes (versioned) ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use("/api/v1/contact", contactRoutes);

// --- SEO endpoints (served at root, not versioned) ---
app.use("/", sitemapRoutes); // exposes /sitemap.xml, /robots.txt, /rss.xml

// --- Health Check ---
app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// --- Error Handlers ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => console.log(`EduEpic API running on port ${PORT}`));
};

start();

module.exports = app;