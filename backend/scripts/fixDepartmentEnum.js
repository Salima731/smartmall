/**
 * One-time migration: fix stale department enum values.
 *
 * The 'Queue' department was removed from the User schema.
 * Any existing DB documents still holding department='Queue' will fail
 * Mongoose validation on the next full save (e.g. Google OAuth linking).
 *
 * Run once:  node backend/scripts/fixDepartmentEnum.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI not set in .env');
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const result = await mongoose.connection
    .collection('users')
    .updateMany(
      { department: 'Queue' },           // match stale records
      { $set: { department: 'General' } } // reset to safe default
    );

  console.log(
    `✅  Migration complete — ${result.matchedCount} user(s) matched, ` +
    `${result.modifiedCount} user(s) updated.`
  );

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
