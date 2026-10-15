const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["superadmin", "editor", "author"], default: "author" },
    avatar: { type: String },
    bio: { type: String },
    preferredLanguage: { type: String, default: "en" },
  },
  { timestamps: true }
);

// FIXED: Hash password before saving
userSchema.pre("save", function(next) {
  const user = this;
  
  // Only hash if password is modified
  if (!user.isModified("password")) {
    return next();
  }
  
  // Generate salt and hash
  bcrypt.genSalt(12, (err, salt) => {
    if (err) return next(err);
    
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Alternative compare method (sync)
userSchema.methods.comparePasswordSync = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);