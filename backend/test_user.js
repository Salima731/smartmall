import mongoose from 'mongoose';
import User from './models/userModel.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const user = await User.findById('6a05b142a4ee3e30f345e399');
    console.log('--- TARGET USER DETAILS ---');
    console.log(user);
  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    mongoose.connection.close();
  }
};

run();
