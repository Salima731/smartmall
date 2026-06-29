import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Shop from './models/shopModel.js';
import Review from './models/reviewModel.js';

dotenv.config();

const addMockReviews = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // Find the Shop Owner user
    const shopOwner = await User.findOne({ role: 'Shop Owner' });
    if (!shopOwner) {
      console.log('No Shop Owner user found in database.');
      process.exit(1);
    }

    console.log(`Found Shop Owner: ${shopOwner.name} (${shopOwner.email})`);
    
    if (!shopOwner.shop) {
      console.log('This shop owner does not have a shop assigned yet.');
      process.exit(1);
    }

    const shop = await Shop.findById(shopOwner.shop);
    if (!shop) {
      console.log(`Shop with ID ${shopOwner.shop} not found.`);
      process.exit(1);
    }

    console.log(`Assigned Shop: ${shop.name} (ID: ${shop._id})`);

    // Create or find two separate customer users
    let customer1 = await User.findOne({ email: 'customer1@example.com' });
    if (!customer1) {
      customer1 = await User.create({
        name: 'Sarah Connor',
        email: 'customer1@example.com',
        password: 'password123',
        role: 'User',
        isVerified: true
      });
    }

    let customer2 = await User.findOne({ email: 'customer2@example.com' });
    if (!customer2) {
      customer2 = await User.create({
        name: 'John Connor',
        email: 'customer2@example.com',
        password: 'password123',
        role: 'User',
        isVerified: true
      });
    }

    // Clean out old reviews from these mock users to prevent duplication issues
    await Review.deleteMany({
      targetType: 'Shop',
      targetId: shop._id,
      user: { $in: [customer1._id, customer2._id] }
    });

    // Insert mock reviews
    const review1 = await Review.create({
      user: customer1._id,
      targetType: 'Shop',
      targetId: shop._id,
      mall: shop.mall || shopOwner.mall,
      rating: 5,
      comment: 'Absolutely love this store! The collection is incredible and the shop owner is extremely helpful and polite. Will definitely visit again!',
      status: 'Approved'
    });

    const review2 = await Review.create({
      user: customer2._id,
      targetType: 'Shop',
      targetId: shop._id,
      mall: shop.mall || shopOwner.mall,
      rating: 4,
      comment: 'Excellent customer service. The smart checkout queue was very quick and saved us a lot of time. Highly recommend checking them out!',
      status: 'Approved'
    });

    console.log(`Successfully created 2 customer reviews for shop "${shop.name}"!`);
    
    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error seeding mock reviews:', error);
    process.exit(1);
  }
};

addMockReviews();
