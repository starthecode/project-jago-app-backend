import express from 'express';
import { signup, updatePassword } from '../controllers/auth.controller.js';
import { signin } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/signin', signin);

router.post('/updatePass', updatePassword);

export default router;
