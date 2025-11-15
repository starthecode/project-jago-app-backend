import express from 'express';
import bcryptjs from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { errorhandler } from '../utils/error.js';
import { Resend } from 'resend';

const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Utility example (optional)
// const isProEmail = (email) => email.split('@')[1]?.toLowerCase() === 'gmail.com';

router.post('/getOtp', async (req, res, next) => {
  const { email, password, type } = req.body;

  if (!email) return next(errorhandler(400, 'Email is required'));
  if (type !== 'forgotpass' && !password)
    return next(errorhandler(400, 'Password is required'));

  try {
    // LOGIN + FORGOT FLOW
    if (type !== 'signup') {
      const validUser = await prisma.user.findUnique({ where: { email } });
      if (!validUser) return next(errorhandler(404, 'User not found'));

      if (type === 'signin') {
        const validPassword = bcryptjs.compareSync(
          password,
          validUser.password
        );
        if (!validPassword) return next(errorhandler(400, 'Invalid password'));
      }
    }

    // SIGNUP FLOW
    if (type === 'signup') {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        return next(errorhandler(400, 'User already registered'));
    }

    // Optional domain restriction:
    // if (!isProEmail(email)) return next(errorhandler(400, 'Only official accounts are allowed'));

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Clear old OTPs
    await prisma.otp.deleteMany({ where: { email } });

    // Save new OTP
    await prisma.otp.create({
      data: { email, otp, type },
    });

    // SEND OTP EMAIL USING RESEND
    await resend.emails.send({
      from: 'Jago App <no-reply@resend.dev>',
      to: email,
      subject: `Your OTP Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
        border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #f2692a; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
            OTP Verification
          </h2>
          <p>Your One-Time Password is:</p>
          <p style="font-size: 22px; font-weight: bold; color: #333;">${otp}</p>
          <p>This OTP is valid for <strong>2 minutes</strong>.</p>
          <footer style="margin-top: 30px; font-size: 12px; color: #f2692a; text-align: center;">
            © ${new Date().getFullYear()} Jago App. All rights reserved.
          </footer>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return next(errorhandler(500, error.message));
  }
});

// VERIFY OTP
router.post('/verifyOtp', async (req, res, next) => {
  const { email, otp, type } = req.body;

  if (!email || !otp)
    return next(errorhandler(400, 'Email and OTP are required'));

  try {
    const record = await prisma.otp.findFirst({
      where: { email, otp: Number(otp), type },
    });

    if (!record) return next(errorhandler(400, 'Invalid OTP'));

    const now = Date.now();
    const created = new Date(record.createdAt).getTime();

    if (now - created > 2 * 60 * 1000) {
      await prisma.otp.delete({ where: { id: record.id } });
      return next(errorhandler(400, 'OTP expired. Please request again.'));
    }

    await prisma.otp.delete({ where: { id: record.id } });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      type,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    next(errorhandler(500, 'An error occurred while verifying OTP'));
  }
});

export default router;
