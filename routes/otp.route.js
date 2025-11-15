import express from 'express';
import nodemailer from 'nodemailer';
import bcryptjs from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { errorhandler } from '../utils/error.js';

const router = express.Router();

// Utility: only allow bizmetric.com
const isProEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === 'gmail.com';
};

router.post('/getOtp', async (req, res, next) => {
  const { email, password, type } = req.body;

  if (!email) return next(errorhandler(400, 'Email is required'));
  if (type !== 'forgotpass' && !password)
    return next(errorhandler(400, 'Password is required'));

  try {
    if (type !== 'signup') {
      // Fetch user from Prisma
      const validUser = await prisma.user.findUnique({ where: { email } });
      if (!validUser) return next(errorhandler(404, 'User not found'));

      // Validate password for signin
      if (type === 'signin') {
        const validPassword = bcryptjs.compareSync(
          password,
          validUser.password
        );
        if (!validPassword) return next(errorhandler(400, 'Invalid password'));
      }
    } else {
      // For signup, ensure user does not exist
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        return next(errorhandler(400, 'User already registered'));
    }

    if (!isProEmail(email))
      return next(errorhandler(400, 'Only official accounts are allowed'));

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete existing OTPs for this email
    await prisma.otp.deleteMany({ where: { email } });

    // Save new OTP
    await prisma.otp.create({
      data: { email, otp, type },
    });

    // Nodemailer config
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.NODEMAILER_EMAIL,
    //     pass: process.env.NODEMAILER_PW,
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_EMAIL, // This must be your Gmail sender
        pass: process.env.BREVO_SMTP_KEY, // SMTP key from Brevo
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.BREVO_EMAIL,
      to: email,
      subject: `App verification code - ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #f2692a; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Verify your request</h2>
          <p><strong>OTP:</strong> <span style="color: #4b4f53;">${otp}</span></p>
          <footer style="margin-top: 30px; font-size: 12px; color: #f2692a; text-align: center;">
            © ${new Date().getFullYear()} BIZ-METRIC PARTNERS. ALL RIGHTS RESERVED.
          </footer>
        </div>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Error sending OTP:', error); // print full error
    return next(errorhandler(500, error.message)); // <-- use real error
  }
});

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

    // Delete OTP after verification
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
