// createAdmin.mjs — Admin user create பண்ண script
// Run: node createAdmin.mjs

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

// =============================================
// 👇 Admin details — change as needed
// =============================================
const ADMIN_EMAIL    = 'admin@mazhaivaanam.com';
const ADMIN_PASSWORD = 'Admin@2026!';
const ADMIN_FIRST    = 'Mazhai';
const ADMIN_LAST     = 'Admin';
const ADMIN_PHONE    = '9999999999';
// =============================================

const userSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true, trim: true },
    lastName:   { type: String, trim: true, default: '' },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, trim: true, default: '' },
    password:   { type: String, required: true, select: false },
    role:       { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔌 MongoDB connecting...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected!');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  User already exists: ${ADMIN_EMAIL}`);
      console.log(`   Role: ${existing.role}`);
      
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.isVerified = true;
        await existing.save();
        console.log('✅ Role updated to admin!');
      } else {
        console.log('✅ Already an admin — no changes needed.');
      }
    } else {
      const admin = new User({
        firstName:  ADMIN_FIRST,
        lastName:   ADMIN_LAST,
        email:      ADMIN_EMAIL,
        phone:      ADMIN_PHONE,
        password:   ADMIN_PASSWORD,
        role:       'admin',
        isActive:   true,
        isVerified: true,
      });

      await admin.save();
      console.log('');
      console.log('🎉 Admin user created successfully!');
      console.log('─────────────────────────────────');
      console.log(`📧 Email    : ${ADMIN_EMAIL}`);
      console.log(`🔑 Password : ${ADMIN_PASSWORD}`);
      console.log(`👤 Role     : admin`);
      console.log('─────────────────────────────────');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
    process.exit(0);
  }
}

createAdmin();
