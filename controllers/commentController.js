const Comment = require("../models/Comment");
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

exports.getCommentsForBlog = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ blog: req.params.blogId, approved: true }).sort({ createdAt: -1 });
  return successResponse(res, comments);
});

exports.createComment = asyncHandler(async (req, res) => {
  const comment = await Comment.create(req.body);
  return successResponse(res, comment, "Comment submitted for review", 201);
});
