import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createDefaultLawyerProfile } from '../services/lawyer.service';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const signToken = (id: string, email: string, role: string): string => {
  return jwt.sign({ id, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

const formatUser = (user: InstanceType<typeof User>) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (role === 'admin') {
    throw new AppError('Admin accounts cannot be registered publicly', 403);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password, role });

  if (role === 'lawyer') {
    await createDefaultLawyerProfile(user._id);
  }

  const token = signToken(user._id.toString(), user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: formatUser(user),
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.isActive === false) {
    throw new AppError('Your account has been deactivated', 403);
  }

  const token = signToken(user._id.toString(), user.email, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: formatUser(user),
      token,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user: formatUser(user) },
  });
});
