import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { LawyerProfile } from '../models/LawyerProfile';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginationMeta } from '../utils/pagination';
import {
  createDefaultLawyerProfile,
  formatLawyerProfile,
  getLawyerUser,
} from '../services/lawyer.service';

const startOfDay = (dateStr: string): Date => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const getLawyers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const {
    search,
    specialization,
    city,
    language,
    minRating,
    maxFee,
    sortBy = 'rating',
    sortOrder = 'desc',
  } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {
    $or: [
      { verificationStatus: 'approved' },
      { verificationStatus: { $exists: false } },
    ],
  };

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' };
  }
  if (city) {
    filter.city = { $regex: city, $options: 'i' };
  }
  if (language) {
    filter.languages = { $regex: language, $options: 'i' };
  }
  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating) };
  }
  if (maxFee) {
    filter.consultationFee = { $lte: parseFloat(maxFee) };
  }

  const sortField =
    sortBy === 'fee' ? 'consultationFee' : sortBy === 'experience' ? 'experience' : 'rating';
  const sort: Record<string, 1 | -1> = {
    [sortField]: sortOrder === 'asc' ? 1 : -1,
  };

  let profiles = await LawyerProfile.find(filter)
    .populate('userId', 'name email role')
    .sort(sort)
    .lean();

  if (search) {
    const q = search.toLowerCase();
    profiles = profiles.filter((p) => {
      const user = p.userId as { name?: string };
      const nameMatch = user?.name?.toLowerCase().includes(q);
      const specMatch = p.specialization?.some((s: string) =>
        s.toLowerCase().includes(q)
      );
      return nameMatch || specMatch;
    });
  }

  profiles = profiles.filter((p) => {
    const user = p.userId as { role?: string };
    return user?.role === 'lawyer';
  });

  const total = profiles.length;
  const paginated = profiles.slice(skip, skip + limit);

  const lawyers = paginated.map((p) => {
    const populatedUser = p.userId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
    };
    return formatLawyerProfile(
      p as unknown as Parameters<typeof formatLawyerProfile>[0],
      {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
      }
    );
  });

  res.json({
    success: true,
    data: { lawyers },
    meta: paginationMeta(total, page, limit),
  });
});

export const getLawyerById = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const lawyerId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
  const user = await getLawyerUser(lawyerId);
  if (!user) {
    throw new AppError('Lawyer not found', 404);
  }

  let profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await createDefaultLawyerProfile(user._id);
  }

  if (
    profile.verificationStatus === 'pending' ||
    profile.verificationStatus === 'rejected'
  ) {
    throw new AppError('Lawyer not found', 404);
  }

  const fromDate = req.query.fromDate as string | undefined;
  const slotFilter: Record<string, unknown> = {
    lawyerId: user._id,
    status: 'available',
    date: { $gte: startOfDay(fromDate || new Date().toISOString().slice(0, 10)) },
  };

  const slots = await AvailabilitySlot.find(slotFilter)
    .sort({ date: 1, startTime: 1 })
    .limit(50);

  res.json({
    success: true,
    data: {
      lawyer: formatLawyerProfile(profile, user),
      availableSlots: slots.map((s) => ({
        id: s._id.toString(),
        date: s.date.toISOString().slice(0, 10),
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    },
  });
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || user.role !== 'lawyer') {
    throw new AppError('Only lawyers can update lawyer profiles', 403);
  }

  let profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await createDefaultLawyerProfile(user._id);
  }

  Object.assign(profile, req.body);
  await profile.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { lawyer: formatLawyerProfile(profile, user) },
  });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || user.role !== 'lawyer') {
    throw new AppError('Only lawyers can access this profile', 403);
  }

  let profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await createDefaultLawyerProfile(user._id);
  }

  res.json({
    success: true,
    data: {
      lawyer: formatLawyerProfile(profile, user, { includeVerification: true }),
    },
  });
});

export const getMyVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || user.role !== 'lawyer') {
    throw new AppError('Only lawyers can access verification', 403);
  }

  let profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await createDefaultLawyerProfile(user._id);
  }

  res.json({
    success: true,
    data: {
      verification: {
        barCouncilNumber: profile.barCouncilNumber ?? null,
        yearsOfPractice: profile.yearsOfPractice,
        verificationStatus: profile.verificationStatus,
        rejectionReason: profile.rejectionReason ?? null,
      },
    },
  });
});

export const submitVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || user.role !== 'lawyer') {
    throw new AppError('Only lawyers can submit verification', 403);
  }

  const { barCouncilNumber, yearsOfPractice } = req.body;

  let profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await createDefaultLawyerProfile(user._id);
  }

  profile.barCouncilNumber = barCouncilNumber;
  profile.yearsOfPractice = yearsOfPractice;
  profile.verificationStatus = 'pending';
  profile.rejectionReason = undefined;
  await profile.save();

  res.json({
    success: true,
    message: 'Verification request submitted',
    data: {
      verification: {
        barCouncilNumber: profile.barCouncilNumber,
        yearsOfPractice: profile.yearsOfPractice,
        verificationStatus: profile.verificationStatus,
        rejectionReason: null,
      },
    },
  });
});

export const createAvailabilitySlot = asyncHandler(
  async (req: Request, res: Response) => {
    const { date, startTime, endTime } = req.body;
    const lawyerId = req.user!.id;

    const slotDate = startOfDay(date);
    const existing = await AvailabilitySlot.findOne({
      lawyerId,
      date: slotDate,
      startTime,
    });
    if (existing) {
      throw new AppError('This time slot already exists', 409);
    }

    const slot = await AvailabilitySlot.create({
      lawyerId,
      date: slotDate,
      startTime,
      endTime,
      status: 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Availability slot created',
      data: {
        slot: {
          id: slot._id.toString(),
          date: slot.date.toISOString().slice(0, 10),
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
      },
    });
  }
);

export const getMyAvailabilitySlots = asyncHandler(
  async (req: Request, res: Response) => {
    const slots = await AvailabilitySlot.find({ lawyerId: req.user!.id })
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: {
        slots: slots.map((s) => ({
          id: s._id.toString(),
          date: s.date.toISOString().slice(0, 10),
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
        })),
      },
    });
  }
);

export const deleteAvailabilitySlot = asyncHandler(
  async (req: Request, res: Response) => {
    const slot = await AvailabilitySlot.findOne({
      _id: req.params.slotId,
      lawyerId: req.user!.id,
    });

    if (!slot) {
      throw new AppError('Slot not found', 404);
    }
    if (slot.status === 'booked') {
      throw new AppError('Cannot delete a booked slot', 400);
    }

    await slot.deleteOne();

    res.json({
      success: true,
      message: 'Slot deleted successfully',
    });
  }
);
