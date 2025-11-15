import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import compression from 'compression';
import prisma from './utils/prisma.js';

// Route imports
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
// import settingsRoutes from './routes/settings.route.js';
import otpRoutes from './routes/otp.route.js';
import attendanceRoutes from './routes/attendance.routes.js';

dotenv.config();

// Optional: check PostgreSQL connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Prisma');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
}
connectDB();

// Define app and middleware
const __dirname = path.resolve();
const app = express();

app.use(compression());
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:8080', // your frontend dev origin
    origin: true,
    credentials: true,
  })
);

const PORT = process.env.PORT || 3000;

// Routes
// app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);

app.use('/otp', otpRoutes);
// include others below if needed
// ... etc

app.set('trust proxy', true);

// Serve frontend (if using React/Vite build)
app.use(express.static(path.join(__dirname, '/frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
