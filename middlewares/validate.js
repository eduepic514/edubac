// /** Generic Joi validation middleware factory used by all routes. */
// module.exports = (schema) => {
//   // ✅ Check if schema is provided
//   if (!schema) {
//     console.error("❌ Validation schema is required!");
//     return (req, res, next) => next();
//   }
  
//   return (req, res, next) => {
//     try {
//       // ✅ Log the incoming body for debugging
//       console.log("📝 Validating body:", JSON.stringify(req.body, null, 2));
//       console.log("📁 Files:", req.files ? Object.keys(req.files) : "No files");
      
//       // ✅ Clone body and parse JSON strings
//       const bodyToValidate = { ...req.body };
      
//       // ✅ Parse translations if it's a string
//       if (typeof bodyToValidate.translations === 'string') {
//         try {
//           bodyToValidate.translations = JSON.parse(bodyToValidate.translations);
//           console.log("✅ Translations parsed in validator");
//         } catch (e) {
//           console.error("❌ Failed to parse translations in validator:", e);
//         }
//       }
      
//       // ✅ Parse tags if it's a string
//       if (typeof bodyToValidate.tags === 'string') {
//         try {
//           bodyToValidate.tags = JSON.parse(bodyToValidate.tags);
//           console.log("✅ Tags parsed in validator");
//         } catch (e) {
//           bodyToValidate.tags = bodyToValidate.tags.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; });
//           console.log("✅ Tags parsed from comma-separated string in validator");
//         }
//       }
      
//       // ✅ Remove file fields from validation
//       delete bodyToValidate.image;
//       delete bodyToValidate.video;
      
//       // ✅ Validate
//       const { error } = schema.validate(bodyToValidate, { abortEarly: false });
//       if (error) {
//         console.error("❌ Validation errors:", JSON.stringify(error.details, null, 2));
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: error.details.map(function(d) { return d.message; }),
//         });
//       }
      
//       // ✅ Update req.body with parsed values
//       req.body = bodyToValidate;
      
//       next();
//     } catch (error) {
//       console.error("❌ Validation middleware error:", error);
//       next(error);
//     }
//   };
// };

/**
 * Generic Joi validation middleware factory used by all routes.
 * Handles parsing of JSON strings in FormData and validates the request body.
 */
module.exports = (schema) => {
  // ✅ Check if schema is provided
  if (!schema) {
    console.error("❌ Validation schema is required!");
    return (req, res, next) => next();
  }
  
  return (req, res, next) => {
    try {
      // ✅ Log the incoming body for debugging
      console.log("========================================");
      console.log("📝 Validation middleware called");
      console.log("📝 Content-Type:", req.headers['content-type']);
      console.log("📝 Body:", JSON.stringify(req.body, null, 2));
      console.log("📁 Files in validate:", req.files ? Object.keys(req.files) : "No files");
      
      // ✅ Clone body and parse JSON strings
      const bodyToValidate = { ...req.body };
      
      // ✅ Parse translations if it's a string (from FormData)
      if (typeof bodyToValidate.translations === 'string') {
        try {
          bodyToValidate.translations = JSON.parse(bodyToValidate.translations);
          console.log("✅ Translations parsed in validator");
        } catch (e) {
          console.error("❌ Failed to parse translations in validator:", e);
        }
      }
      
      // ✅ Parse tags if it's a string (from FormData or comma-separated)
      if (typeof bodyToValidate.tags === 'string') {
        try {
          // Try to parse as JSON first
          bodyToValidate.tags = JSON.parse(bodyToValidate.tags);
          console.log("✅ Tags parsed as JSON in validator");
        } catch (e) {
          // If not JSON, treat as comma-separated string
          bodyToValidate.tags = bodyToValidate.tags
            .split(',')
            .map(function(t) { return t.trim(); })
            .filter(function(t) { return t; });
          console.log("✅ Tags parsed from comma-separated string in validator:", bodyToValidate.tags);
        }
      }
      
      // ✅ Parse featured if it's a string
      if (typeof bodyToValidate.featured === 'string') {
        bodyToValidate.featured = bodyToValidate.featured === 'true' || bodyToValidate.featured === '1';
        console.log("✅ Featured parsed as:", bodyToValidate.featured);
      }
      
      // ✅ Remove file fields from validation (they are handled by multer)
      delete bodyToValidate.image;
      delete bodyToValidate.video;
      delete bodyToValidate.imagePath;
      delete bodyToValidate.videoPath;
      
      // ✅ Validate using the schema
      const { error, value } = schema.validate(bodyToValidate, { 
        abortEarly: false,
        stripUnknown: false
      });
      
      if (error) {
        console.error("❌ Validation errors:", JSON.stringify(error.details, null, 2));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map(function(d) { 
            return d.message; 
          }),
        });
      }
      
      // ✅ Update req.body with validated and parsed values
      req.body = value;
      
      console.log("✅ Validation passed");
      console.log("========================================");
      
      next();
    } catch (error) {
      console.error("❌ Validation middleware error:", error);
      console.log("========================================");
      next(error);
    }
  };
};