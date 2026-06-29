/**
 * Seed script — creates 2 parking spaces + 40 bays for a given mall.
 *
 * Usage:
 *   node backend/scripts/seedParkingBays.js <mallId>
 *
 * Example:
 *   node backend/scripts/seedParkingBays.js 683c0a1f2b4e5a001c7890ab
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

const mallId = process.argv[2];
if (!mallId || !mongoose.Types.ObjectId.isValid(mallId)) {
  console.error('❌  Usage: node seedParkingBays.js <mallId>');
  process.exit(1);
}

// Inline schemas so we don't need compiled models
const spaceSchema = new mongoose.Schema({
  mall: mongoose.Schema.Types.ObjectId,
  name: String,
  totalCapacity: Number,
  availableSpaces: Number,
  occupiedSpaces: { type: Number, default: 0 },
  parkingFeePerHour: { type: Number, default: 0 },
  vehicleType: String,
  status: { type: String, default: 'Available' },
}, { timestamps: true });

const baySchema = new mongoose.Schema({
  parkingSpace: mongoose.Schema.Types.ObjectId,
  slotNumber: String,
  status: { type: String, default: 'Available' },
}, { timestamps: true });

const ParkingSpace = mongoose.model('ParkingSpace', spaceSchema);
const ParkingBay   = mongoose.model('ParkingBay', baySchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Avoid re-seeding if bays already exist for this mall
  const existing = await ParkingSpace.findOne({ mall: mallId });
  if (existing) {
    const bayCount = await ParkingBay.countDocuments({ parkingSpace: existing._id });
    if (bayCount > 0) {
      console.log(`ℹ️   Already seeded: ${bayCount} bays found. Skipping.`);
      await mongoose.disconnect();
      return;
    }
  }

  const zones = [
    { prefix: 'A', label: 'Block A — Four Wheeler', type: 'Four-Wheeler', slots: 20, fee: 30 },
    { prefix: 'B', label: 'Block B — Two Wheeler',  type: 'Two-Wheeler',  slots: 20, fee: 10 },
  ];

  for (const zone of zones) {
    const space = await ParkingSpace.create({
      mall: mallId,
      name: zone.label,
      totalCapacity: zone.slots,
      availableSpaces: zone.slots,
      occupiedSpaces: 0,
      parkingFeePerHour: zone.fee,
      vehicleType: zone.type,
      status: 'Available',
    });

    const bays = Array.from({ length: zone.slots }, (_, i) => ({
      parkingSpace: space._id,
      slotNumber: `${zone.prefix}${String(i + 1).padStart(2, '0')}`,
      status: 'Available',
    }));

    await ParkingBay.insertMany(bays);
    console.log(`✅  Created space "${zone.label}" with ${zone.slots} bays (${zone.type})`);
  }

  console.log('🎉  Parking seed complete — 40 bays created.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
