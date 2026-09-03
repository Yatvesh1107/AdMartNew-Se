const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    const adminUserId = process.env.ADMIN_USERID || 'admin';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    const existingAdmin = await Admin.findOne({ userId: adminUserId });

    if (existingAdmin) {
      console.log(`Admin user '${adminUserId}' already exists. Skipping seed.`);
    } else {
      await Admin.create({
        userId: adminUserId,
        password: adminPassword,
        name: 'Super Admin',
      });
      console.log(`Admin user seeded successfully:`);
      console.log(`  User ID: ${adminUserId}`);
      console.log(`  Password: ${adminPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
