/** Wraps async route handlers so thrown errors reach errorHandler.js */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
