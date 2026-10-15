const router = require("express").Router();
const commentController = require("../controllers/commentController");

// ✅ Make sure controller exists
console.log("✅ commentRoutes loaded");

router.get("/:blogId", commentController.getCommentsForBlog);
router.post("/", commentController.createComment);

module.exports = router;