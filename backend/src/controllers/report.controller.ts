import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import {
  assertReportTargetExists,
  formatReport,
} from '../services/report.service';

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  const { targetType, targetId, reason } = req.body;
  const reporterId = req.user!.id;

  await assertReportTargetExists(targetType, targetId);

  const existing = await Report.findOne({
    reporterId,
    targetType,
    targetId,
    status: 'pending',
  });
  if (existing) {
    throw new AppError('You already reported this content', 409);
  }

  const report = await Report.create({
    reporterId,
    targetType,
    targetId,
    reason,
    status: 'pending',
  });

  const formatted = await formatReport(report);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: { report: formatted },
  });
});
