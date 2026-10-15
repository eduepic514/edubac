const router = require("express").Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

router.post("/login", authController.login);
router.get("/me", protect, authController.me);

module.exports = router;