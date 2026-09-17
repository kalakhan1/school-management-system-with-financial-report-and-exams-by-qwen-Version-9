require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Setting = require('../models/Setting');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding...');

    // 1. Purana Admin delete karein (Clean slate)
    await User.deleteMany({ username: 'admin' });
    console.log('🗑️ Old admin users cleared.');

    // 2. Naya Fresh Admin banayein 
    // ✅ FIX: Plain text password bhejo, User model ka pre-save hook isay automatically hash kar dega
    await User.create({
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@school.com',
      passwordHash: 'admin123', 
      role: 'Admin',
      status: 'Active'
    });
    console.log('✅ Fresh Admin User Created Successfully!');
    console.log('   👉 Username: admin');
    console.log('   👉 Password: admin123');

    // 3. Default Classes
    const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    for (const className of classes) {
      const exists = await Class.findOne({ className });
      if (!exists) await Class.create({ className, section: 'A' });
    }
    console.log('✅ Default Classes Created');

    // 4. Default Settings
    const settingsExist = await Setting.findOne();
    if (!settingsExist) {
      await Setting.create({
        schoolName: 'My School ERP',
        academicYear: '2026-2027',
        currency: 'Rs.'
      });
      console.log('✅ Default Settings Created');
    }

    console.log('\n🎉 SEEDING COMPLETE! Ab aap login kar sakte hain.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();