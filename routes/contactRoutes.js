const router = require("express").Router();
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { sendContactEmail } = require("../config/email");

console.log("✅ contactRoutes loaded");

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email and message are required" });
    }

    // Send email to admin
    await sendContactEmail(name, email, subject, message);

    return successResponse(res, { name, email, subject }, "Message sent successfully. We'll get back to you soon!");
  })
);

module.exports = router;