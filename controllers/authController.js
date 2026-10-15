const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  const token = signToken(user._id);
  const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };
  return successResponse(res, { token, user: safeUser }, "Login successful");
});

exports.me = asyncHandler(async (req, res) => {
  return successResponse(res, req.user);
});
