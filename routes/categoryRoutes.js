const router = require("express").Router();
const categoryController = require("../controllers/categoryController");
const { protect, authorize } = require("../middlewares/auth");
const { uploadFiles } = require("../middlewares/upload");

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

router.post(
  "/",
  protect,
  authorize("superadmin", "editor"),
  uploadFiles, // image field accept karega
  categoryController.createCategory
);

router.put(
  "/:id",
  protect,
  authorize("superadmin", "editor"),
  uploadFiles,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  protect,
  authorize("superadmin"),
  categoryController.deleteCategory
);

module.exports = router;