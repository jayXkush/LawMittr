/**
 * Ensures the demo admin account exists.
 * Run: npm run seed:admin
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ensureAdminAccount } from '../services/seedAdmin.service';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in backend/.env');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  await ensureAdminAccount();
  console.log('\n--- Admin account ready ---');
  console.log(`Email:    ${process.env.ADMIN_EMAIL ?? 'adminlawmittr@gmail.com'}`);
  console.log('Login:    http://localhost:5173/admin/login\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
