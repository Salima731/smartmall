import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import users from './users.js';
import User from '../models/userModel.js';
import Mall from '../models/mallModel.js';
import Shop from '../models/shopModel.js';
import Product from '../models/productModel.js';
import connectDB from '../config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Mall.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();

    const createdUsers = await User.insertMany(users);
    const superAdmin = createdUsers[0]._id;
    const mallAdmin = createdUsers[1]._id;

    // Add sample mall
    const mall = await Mall.create({
      name: 'Grand Mall',
      district: 'Downtown',
      address: '123 Main St',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      admin: mallAdmin,
    });

    await User.findByIdAndUpdate(mallAdmin, { mall: mall._id });

    // Add sample shop
    const shop = await Shop.create({
      name: 'Nike Store',
      mall: mall._id,
      owner: createdUsers[2]._id, // Shop Owner
      category: 'Footwear',
      floor: 'Ground Floor',
    });

    // Add sample product
    await Product.create({
      name: 'Nike Air Max',
      description: 'Comfortable running shoes',
      price: 120,
      category: 'Shoes',
      shop: shop._id,
      mall: mall._id,
      countInStock: 10,
    });

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Mall.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
