import { User } from '../models/User';
import { env } from '../config/env';

export const ensureAdminAccount = async (): Promise<void> => {
  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`[seed] Promoted existing user to admin: ${email}`);
    }
    return;
  }

  await User.create({
    name: 'LawMittr Admin',
    email,
    password: env.ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
  });

  console.log(`[seed] Created admin account: ${email}`);
};
