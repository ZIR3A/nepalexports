const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the Mongoose model directly since we're running a simple script outside Next.js
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, select: false },
  role: String,
  kycStatus: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'saranbrl35@gmail.com';
    const plainPassword = 'superadmin';
    const role = 'super_admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists! Updating password and role...`);
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(plainPassword, salt);
      existingUser.role = role;
      existingUser.kycStatus = 'COMPLETED'; // Admins don't need KYC
      await existingUser.save();
      console.log('User updated successfully!');
    } else {
      console.log('Creating new superadmin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      await User.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role,
        kycStatus: 'COMPLETED' // Admins don't need KYC
      });
      console.log('Superadmin created successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
