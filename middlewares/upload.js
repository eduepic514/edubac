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
//     let uploadPath = 'uploads/images/';
    
//     // ✅ Determine folder based on file type
//     if (file.fieldname === 'image' || file.fieldname === 'featuredImage') {
//       uploadPath = 'uploads/images/';
//     } else if (file.fieldname === 'video') {
//       uploadPath = 'uploads/videos/';
//     }
    
//     const fullPath = path.join(__dirname, '..', uploadPath);
//     if (!fs.existsSync(fullPath)) {
//       fs.mkdirSync(fullPath, { recursive: true });
//     }
    
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     const filename = file.fieldname + '-' + uniqueSuffix + ext;
//     console.log(`📤 Generated filename: ${filename}`);
//     cb(null, filename);
//   }
// });

// // ✅ File filter
// const fileFilter = (req, file, cb) => {
//   console.log(`📤 Uploading file: ${file.fieldname}, ${file.originalname}, ${file.mimetype}`);
  
//   if (file.fieldname === 'image' || file.fieldname === 'featuredImage') {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed for featured image'), false);
//     }
//   } else if (file.fieldname === 'video') {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed'), false);
//     }
//   } else {
//     cb(new Error('Unexpected field: ' + file.fieldname), false);
//   }
// };

// // ✅ Configure multer
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB max
//   }
// });

// // ✅ Middleware to handle multiple file uploads
// const uploadFiles = (req, res, next) => {
//   console.log("📤 uploadFiles middleware called");
//   console.log("📤 Content-Type:", req.headers['content-type']);
//   console.log("📤 Method:", req.method);
//   console.log("📤 URL:", req.url);
  
//   const uploadFields = upload.fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'video', maxCount: 1 },
//   ]);
  
//   uploadFields(req, res, (err) => {
//     if (err) {
//       console.error("❌ Multer error:", err);
      
//       if (err instanceof multer.MulterError) {
//         if (err.code === 'FILE_TOO_LARGE') {
//           return res.status(400).json({
//             success: false,
//             message: 'File too large. Maximum size is 100MB.'
//           });
//         }
//         if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//           return res.status(400).json({
//             success: false,
//             message: 'Unexpected file field. Allowed: image, video'
//           });
//         }
//         return res.status(400).json({
//           success: false,
//           message: `Upload error: ${err.message}`
//         });
//       }
      
//       return res.status(400).json({
//         success: false,
//         message: err.message || 'File upload failed'
//       });
//     }
    
//     // ✅ Log uploaded files
//     if (req.files) {
//       console.log("📤 Files uploaded successfully:");
//       Object.keys(req.files).forEach(key => {
//         const files = req.files[key];
//         if (files && files.length > 0) {
//           files.forEach(f => {
//             console.log(`  ${key}: ${f.originalname} -> ${f.path}`);
//           });
//         }
//       });
//     } else {
//       console.log("📤 No files uploaded");
//     }
    
//     next();
//   });
// };

// module.exports = { uploadFiles };




const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier"); // optional, but better to use built-in

console.log("✅ Upload middleware (Cloudinary - modern) loaded");

// Memory storage (file disk pe save nahi hogi)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(`📤 Uploading: ${file.fieldname} | ${file.originalname} | ${file.mimetype}`);

  if (file.fieldname === "image" || file.fieldname === "featuredImage") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  } else if (file.fieldname === "video") {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  } else {
    cb(new Error("Unexpected field: " + file.fieldname), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, resource_type = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resource_type,
        transformation: resource_type === "image" ? [{ quality: "auto", fetch_format: "auto" }] : undefined,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const uploadFiles = (req, res, next) => {
  console.log("📤 uploadFiles middleware called");

  const uploadFields = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]);

  uploadFields(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer error:", err);

      if (err instanceof multer.MulterError) {
        if (err.code === "FILE_TOO_LARGE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 100MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      // Upload image to Cloudinary
      if (req.files?.image?.[0]) {
        const result = await uploadToCloudinary(
          req.files.image[0].buffer,
          "eduepic/images",
          "image"
        );
        // Controller ke liye same structure maintain karte hain
        req.files.image[0].path = result.secure_url;
        req.files.image[0].filename = result.public_id;
        console.log("✅ Image uploaded to Cloudinary:", result.secure_url);
      }

      // Upload video to Cloudinary
      if (req.files?.video?.[0]) {
        const result = await uploadToCloudinary(
          req.files.video[0].buffer,
          "eduepic/videos",
          "video"
        );
        req.files.video[0].path = result.secure_url;
        req.files.video[0].filename = result.public_id;
        console.log("✅ Video uploaded to Cloudinary:", result.secure_url);
      }

      next();
    } catch (uploadError) {
      console.error("❌ Cloudinary upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to Cloudinary",
        error: uploadError.message,
      });
    }
  });
};

module.exports = { uploadFiles };