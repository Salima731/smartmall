import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const malls = await mongoose.connection.collection('malls').find({}, { projection: { name: 1 } }).toArray();
console.log(JSON.stringify(malls, null, 2));
await mongoose.disconnect();
