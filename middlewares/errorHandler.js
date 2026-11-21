// 

/**
 * Global error handler.
 * Must be a function because server.js does: app.use(errorHandler);
 * Express identifies it as an error handler by the 4-arg signature (err, req, res, next).
 */
module.exports = (err, req, res, next) => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};