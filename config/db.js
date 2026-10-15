const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
