import express from 'express';
import {
  clockIn,
  clockOut,
  getTodayAttendance,
} from '../controllers/attendance.controller.js';

const router = express.Router();

router.get('/today/:userId', getTodayAttendance);
router.post('/clock-in', clockIn);
router.put('/clock-out/:userId', clockOut);

export default router;
