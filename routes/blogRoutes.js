// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// console.log("✅ Upload middleware loaded");

// // ✅ Ensure upload directories exist
// const uploadDirs = ['uploads', 'uploads/images', 'uploads/videos'];
// uploadDirs.forEach(dir => {
//   const dirPath = path.join(__dirname, '..', dir);
//   if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath, { recursive: true });
//     console.log(`✅ Created upload directory: ${dir}`);
//   }
// });

// // ✅ Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = 'uploads/';
    
//     // Determine folder based on file type
//     if (file.fieldname === 'image' || file.fieldname === 'featuredImage') {
//       uploadPath = 'uploads/images/';
//     } else if (file.fieldname === 'video') {
//       uploadPath = 'uploads/videos/';
//     }
    
//     // Create directory if it doesn't exist
//     const fullPath = path.join(__dirname, '..', uploadPath);
//     if (!fs.existsSync(fullPath)) {
//       fs.mkdirSync(fullPath, { recursive: true });
//     }
    
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename: timestamp-randomstring.ext
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//   }
// });

// // ✅ File filter
// const fileFilter = (req, file, cb) => {
//   console.log(`📤 Uploading file: ${file.fieldname}, ${file.originalname}, ${file.mimetype}`);
  
//   // Accept images
//   if (file.fieldname === 'image' || file.fieldname === 'featuredImage') {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed for featured image'), false);
//     }
//   }
//   // Accept videos
//   else if (file.fieldname === 'video') {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed'), false);
//     }
//   }
//   // Reject other fields
//   else {
//     cb(new Error('Unexpected field'), false);
//   }
// };

// // ✅ Configure multer
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB max (for videos)
//   }
// });

// // ✅ Middleware to handle multiple file uploads
// const uploadFiles = (req, res, next) => {
//   console.log("📤 uploadFiles middleware called");
//   console.log("📤 Request headers:", req.headers['content-type']);
//   console.log("📤 Request method:", req.method);
//   console.log("📤 Request URL:", req.url);
  
//   // ✅ Use fields to handle both image and video
//   const uploadFields = upload.fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'video', maxCount: 1 },
//     { name: 'featuredImage', maxCount: 1 }, // For URL fallback
//     { name: 'videoUrl', maxCount: 1 }, // For URL fallback
//   ]);
  
//   uploadFields(req, res, (err) => {
//     if (err) {
//       console.error("❌ Multer error:", err);
      
//       if (err instanceof multer.MulterError) {
//         if (err.code === 'FILE_TOO_LARGE') {
//           return res.status(400).json({ 
//             message: 'File too large. Maximum size is 100MB.' 
//           });
//         }
//         if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//           return res.status(400).json({ 
//             message: 'Unexpected file field. Allowed: image, video' 
//           });
//         }
//         return res.status(400).json({ 
//           message: `Upload error: ${err.message}` 
//         });
//       }
      
//       return res.status(400).json({ 
//         message: err.message || 'File upload failed' 
//       });
//     }
    
//     // ✅ Log uploaded files
//     if (req.files) {
//       console.log("📤 Files uploaded:");
//       Object.keys(req.files).forEach(key => {
//         console.log(`  ${key}:`, req.files[key].map(f => f.originalname));
//       });
      
//       // ✅ Add file paths to req.body for controller
//       if (req.files.image) {
//         req.body.imagePath = req.files.image[0].path;
//         req.body.imageUrl = `/${req.files.image[0].path}`;
//         console.log(`📤 Image saved at: ${req.files.image[0].path}`);
//       }
//       if (req.files.video) {
//         req.body.videoPath = req.files.video[0].path;
//         req.body.videoUrl = `/${req.files.video[0].path}`;
//         console.log(`📤 Video saved at: ${req.files.video[0].path}`);
//       }
//     }
    
//     next();
//   });
// };

// module.exports = { uploadFiles };


const router = require("express").Router();
const blogController = require("../controllers/blogController");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createBlogSchema, updateBlogSchema } = require("../validators/blogValidator");
const { uploadFiles } = require("../middlewares/upload");

console.log("✅ blogRoutes loaded");
console.log("✅ blogController methods:", Object.keys(blogController));

// ✅ Public routes
router.get("/", blogController.getBlogs);
router.get("/:slug", blogController.getBlogBySlug);

// ✅ Protected routes (admin only)
router.post(
  "/", 
  protect, 
  authorize("superadmin", "editor"), 
  uploadFiles,
  validate(createBlogSchema),
  blogController.createBlog
);

router.put(
  "/:id", 
  protect, 
  authorize("superadmin", "editor"), 
  uploadFiles,
  validate(updateBlogSchema),
  blogController.updateBlog
);

router.delete("/:id", protect, authorize("superadmin"), blogController.deleteBlog);

module.exports = router;