import express from 'express';
import {
  updateSettings,
  getSettings,
} from '../controllers/settings.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/update', verifyToken, updateSettings);

router.get('/get', verifyToken, getSettings);

export default router;
