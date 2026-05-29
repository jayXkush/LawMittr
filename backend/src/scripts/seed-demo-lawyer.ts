/**
 * Temporary demo lawyer for booking/payment verification.
 * Undo: npm run seed:demo-lawyer:remove
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in backend/.env');
  process.exit(1);
}
import { User } from '../models/User';
import { LawyerProfile } from '../models/LawyerProfile';
import { AvailabilitySlot } from '../models/AvailabilitySlot';

export const DEMO_LAWYER_EMAIL = 'demo.lawyer@lawmittr.com';
export const DEMO_LAWYER_PASSWORD = 'DemoLawyer1';

function dateAtMidnight(daysFromToday: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d;
}

const SLOTS = [
  { dayOffset: 1, startTime: '10:00', endTime: '11:00' },
  { dayOffset: 1, startTime: '14:00', endTime: '15:00' },
  { dayOffset: 2, startTime: '10:00', endTime: '11:00' },
  { dayOffset: 2, startTime: '15:00', endTime: '16:00' },
  { dayOffset: 3, startTime: '11:00', endTime: '12:00' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  let user = await User.findOne({ email: DEMO_LAWYER_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Adv. Priya Sharma',
      email: DEMO_LAWYER_EMAIL,
      password: DEMO_LAWYER_PASSWORD,
      role: 'lawyer',
    });
    console.log('Created demo lawyer account');
  } else {
    user.name = 'Adv. Priya Sharma';
    user.role = 'lawyer';
    user.password = DEMO_LAWYER_PASSWORD;
    await user.save();
    console.log('Updated existing demo lawyer account');
  }

  await LawyerProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      specialization: ['Criminal Law', 'Family Law'],
      experience: 12,
      city: 'Mumbai',
      languages: ['English', 'Hindi'],
      consultationFee: 2500,
      rating: 4.8,
      ratingCount: 24,
      bio: 'Demo lawyer profile for LawMittr verification. Experienced advocate for criminal and family matters.',
      verificationStatus: 'approved',
      barCouncilNumber: 'DEMO/BC/2024/001',
      yearsOfPractice: 12,
    },
    { upsert: true, new: true }
  );

  let slotsAdded = 0;
  for (const slot of SLOTS) {
    const date = dateAtMidnight(slot.dayOffset);
    const result = await AvailabilitySlot.findOneAndUpdate(
      { lawyerId: user._id, date, startTime: slot.startTime },
      {
        lawyerId: user._id,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'available',
      },
      { upsert: true, new: true }
    );
    if (result) slotsAdded += 1;
  }

  console.log('\n--- Demo lawyer ready ---');
  console.log(`Email:    ${DEMO_LAWYER_EMAIL}`);
  console.log(`Password: ${DEMO_LAWYER_PASSWORD}`);
  console.log(`User ID:  ${user._id.toString()} (for /lawyers/:id)`);
  console.log(`Slots:    ${slotsAdded} availability slot(s)`);
  console.log('Browse:   http://localhost:5173/lawyers');
  console.log('Remove:   npm run seed:demo-lawyer:remove\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
