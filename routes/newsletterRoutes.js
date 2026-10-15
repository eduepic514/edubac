const router = require("express").Router();
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

console.log("✅ newsletterRoutes loaded");

router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    return successResponse(res, { email }, "Subscribed successfully");
  })
);

module.exports = router;