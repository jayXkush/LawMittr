/**
 * Removes the temporary demo lawyer (run when asked to undo seed).
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
import { Appointment } from '../models/Appointment';
import { DEMO_LAWYER_EMAIL } from './seed-demo-lawyer';

async function remove() {
  await mongoose.connect(MONGODB_URI!);

  const user = await User.findOne({ email: DEMO_LAWYER_EMAIL });
  if (!user) {
    console.log('No demo lawyer found — nothing to remove.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const lawyerId = user._id;
  await Appointment.deleteMany({ $or: [{ lawyerId }, { clientId: lawyerId }] });
  await AvailabilitySlot.deleteMany({ lawyerId });
  await LawyerProfile.deleteOne({ userId: lawyerId });
  await User.deleteOne({ _id: lawyerId });

  console.log(`Removed demo lawyer (${DEMO_LAWYER_EMAIL}) and related data.`);
  await mongoose.disconnect();
}

remove().catch((err) => {
  console.error(err);
  process.exit(1);
});
