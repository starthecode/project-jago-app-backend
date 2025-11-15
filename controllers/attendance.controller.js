import prisma from '../utils/prisma.js';
// Get today's attendance for a user
export const getTodayAttendance = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const today = new Date().toISOString().split('T')[0];

    const data = await prisma.attendance.findMany({
      where: {
        user_id: userId,
        clock_in: { gte: new Date(`${today}T00:00:00`) },
      },
      orderBy: { clock_in: 'desc' },
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Clock In
export const clockIn = async (req, res) => {
  try {
    const { user_id, location_lat, location_lng, location_address } = req.body;

    const attendance = await prisma.attendance.create({
      data: {
        user_id,
        location_lat,
        location_lng,
        location_address,
      },
    });

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Clock Out
export const clockOut = async (req, res) => {
  try {
    const { userId } = req.params;

    const updated = await prisma.attendance.update({
      where: { userId: Number(userId) },
      data: { clock_out: new Date().toISOString() },
    });

    res.json({ success: true, attendance: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
