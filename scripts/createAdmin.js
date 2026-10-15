require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduepic";

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Define schema directly in script (bypassing model issues)
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: String,
      preferredLanguage: String,
      bio: String,
      avatar: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'eduepic72@gmail.com' });
    if (existingAdmin) {
      console.log('✅ Admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Use this email to login');
      console.log('🔗 Login URL: http://localhost:5173/admin/login');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    console.log('✅ Password hashed successfully');

    // Create admin
    const admin = await User.create({
      name: 'EduEpic Admin',
      email: 'eduepic72@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      preferredLanguage: 'en',
      bio: 'Super Admin of EduEpic'
    });

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('⚠️ Please change password after first login!');
    console.log('🔗 Login URL: http://localhost:5173/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

createAdmin();