import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getIceServers, validateMeeting } from '../controllers/meeting.controller';

const router = Router();

// All meeting routes require authentication
router.use(authenticate);

// GET /api/meetings/ice-servers
router.get('/ice-servers', getIceServers);

// GET /api/meetings/:meetingId/validate?password=xxx
router.get('/:meetingId/validate', validateMeeting);

export default router;
