import express from 'express';
import {
  getUser,
  getUsers,
  signout,
  updateUser,
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

import { verifyRoute } from '../middleware/authMiddleware.js';

import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// router.get('/test', test);

router.get('/getUsers', verifyToken, getUsers);

router.get('/getUser/:slug', verifyToken, getUser);

router.put('/update/:userId', verifyToken, updateUser);

router.post('/signout', signout);

// admin route
router.get(
  '/dashboard/admin',
  verifyRoute,
  authorizeRoles('admin'),
  (req, res) => {
    res.json({ message: 'Welcome Admin' });
  }
);

// admin and manager route
router.get(
  '/dashboard/manager',
  authorizeRoles('admin', 'manager'),
  (req, res) => {
    res.json({ message: 'Welcome Manager' });
  }
);
// subscriber route
router.get(
  '/dashboard/subscriber',
  authorizeRoles('susbcriber'),
  (req, res) => {
    res.json({ message: 'Welcome Subscriber' });
  }
);
// user route
router.get(
  '/dashboard/user',
  authorizeRoles('admin', 'manager', 'user'),
  (req, res) => {
    res.json({ message: 'Welcome User' });
  }
);

export default router;
