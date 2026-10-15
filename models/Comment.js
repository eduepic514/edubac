const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
