const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  }
  next();
};
