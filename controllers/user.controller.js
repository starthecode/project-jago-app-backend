import bcryptjs from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { errorhandler } from '../utils/error.js';

// ------------------- UPDATE USER -------------------
export const updateUser = async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(errorhandler(403, 'You are not allowed to update this user'));
  }

  try {
    const updateData = {};

    // 🔐 Validate and hash password
    if (req.body.password && req.body.password.trim() !== '') {
      if (req.body.password.length < 6) {
        return next(
          errorhandler(400, 'Password must be at least 6 characters')
        );
      }
      updateData.password = bcryptjs.hashSync(req.body.password, 10);
    }

    // 🧍 First name validation
    if (req.body.firstName) {
      if (req.body.firstName.length < 4 || req.body.firstName.length > 20) {
        return next(
          errorhandler(400, 'First Name must be between 4 and 20 characters')
        );
      }
      updateData.firstName = req.body.firstName;
    }

    // 🧍 Last name validation
    if (req.body.lastName) {
      if (req.body.lastName.length < 4 || req.body.lastName.length > 20) {
        return next(
          errorhandler(400, 'Last Name must be between 4 and 20 characters')
        );
      }
      updateData.lastName = req.body.lastName;
    }

    // 👤 Username validation
    if (req.body.userName) {
      if (req.body.userName.length < 5 || req.body.userName.length > 16) {
        return next(
          errorhandler(400, 'Username must be between 5 and 16 characters')
        );
      }
      if (req.body.userName.includes(' ')) {
        return next(errorhandler(400, 'Username cannot contain spaces'));
      }
      if (req.body.userName !== req.body.userName.toLowerCase()) {
        return next(errorhandler(400, 'Username must be lowercase'));
      }
      if (!req.body.userName.match(/^[a-zA-Z0-9]+$/)) {
        return next(
          errorhandler(400, 'Username can only contain letters and numbers')
        );
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { userName: req.body.userName },
      });
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return next(errorhandler(400, 'Username already taken'));
      }

      updateData.userName = req.body.userName;
    }

    // 📧 Optional fields
    if (req.body.email) updateData.email = req.body.email.toLowerCase();
    if (req.body.profilePicture)
      updateData.profilePicture = req.body.profilePicture;

    // 🧩 Role and admin flag
    if (req.body.role) {
      updateData.role = Array.isArray(req.body.role)
        ? req.body.role
        : [req.body.role];
      updateData.isAdmin = req.body.role.includes('admin');
    }

    // 🛠 Update in DB
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
    });

    const { password, ...rest } = updatedUser;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// ------------------- SIGNOUT -------------------
export const signout = async (req, res, next) => {
  try {
    res
      .clearCookie('access_token')
      .status(200)
      .json('User has been signed out');
  } catch (error) {
    next(error);
  }
};

// ------------------- GET USERS -------------------
export const getUsers = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const sortDirection = req.query.order === 'asc' ? 'asc' : 'desc';

    const users = await prisma.user.findMany({
      skip: startIndex,
      take: limit,
      orderBy: { updatedAt: sortDirection },
      select: {
        id: true,
        email: true,
        userName: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const totalCount = await prisma.user.count();

    // Format response similar to your original structure
    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      userName: u.userName,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      role: u.role?.[0] || 'user',
    }));

    res.status(200).json({
      posts: formatted,
      totalPostCount: totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------- GET SINGLE USER -------------------
export const getUser = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let user;

    // If slug is numeric, treat as ID; else username
    if (/^\d+$/.test(slug)) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(slug) },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { userName: slug },
      });
    }

    if (!user) {
      return next(errorhandler(404, 'User not found'));
    }

    const { password, ...rest } = user;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
