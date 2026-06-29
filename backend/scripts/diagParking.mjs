import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

// Find all staff users with their mall assignments
const staff = await db.collection('users').find(
  { role: { $in: ['Staff', 'Mall Admin'] } },
  { projection: { name: 1, email: 1, role: 1, department: 1, mall: 1 } }
).toArray();

console.log('Staff/Admin users:\n', JSON.stringify(staff, null, 2));

// Also show which malls have existing parking spaces
const spaces = await db.collection('parkingspaces').find({}, { projection: { mall: 1, name: 1 } }).toArray();
console.log('\nExisting parking spaces:\n', JSON.stringify(spaces, null, 2));

// And existing bays count
const bays = await db.collection('parkingbays').countDocuments();
console.log('\nTotal parking bays in DB:', bays);

await mongoose.disconnect();
