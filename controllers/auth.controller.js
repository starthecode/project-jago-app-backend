import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { errorhandler } from '../utils/error.js';

// ------------------- SIGNUP -------------------
export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || email === '' || password === '') {
      return next(errorhandler(400, 'All fields are required'));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return next(errorhandler(400, 'User already exists'));
    }

    const emailUsername = email.split('@')[0];
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
    const userName = `${emailUsername}${uniqueNumber}`;
    const hashedPass = bcryptjs.hashSync(password, 10);

    const savedUser = await prisma.user.create({
      data: {
        userName,
        email: email.toLowerCase(),
        password: hashedPass,
      },
    });

    const token = jwt.sign(
      {
        id: savedUser.id,
        isAdmin: savedUser.isAdmin,
        role: savedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    // Exclude password before sending response
    const { password: _, ...rest } = savedUser;

    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: false, // true for production with HTTPS
        sameSite: 'Lax',
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// ------------------- SIGNIN -------------------
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === '' || password === '') {
    return next(errorhandler(400, 'All fields are required'));
  }

  try {
    const validUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!validUser) {
      return next(errorhandler(404, 'User not found'));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorhandler(400, 'Invalid password'));
    }

    const token = jwt.sign(
      {
        id: validUser.id,
        isAdmin: validUser.isAdmin,
        role: validUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    const { password: _, ...rest } = validUser;

    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// ------------------- UPDATE PASSWORD -------------------
export const updatePassword = async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || email === '' || newPassword === '') {
    return next(errorhandler(400, 'All fields are required'));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return next(errorhandler(404, 'User not found'));
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
