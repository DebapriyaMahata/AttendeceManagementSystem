const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const {
  calculateWorkingHours,
  deriveStatus,
  normalizeDate
} = require('../utils/calculateHours');

// @desc    Check in for today
// @route   POST /api/attendance/check-in
// @access  Private (employee)
const checkIn = asyncHandler(async (req, res) => {
  const today = normalizeDate(new Date());

  let record = await Attendance.findOne({ employee: req.user._id, date: today });

  if (record && record.checkInTime) {
    res.status(400);
    throw new Error('You have already checked in today');
  }

  if (!record) {
    record = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkInTime: new Date(),
      status: 'Incomplete'
    });
  } else {
    record.checkInTime = new Date();
    record.status = 'Incomplete';
    await record.save();
  }

  res.status(201).json({ success: true, data: record });
});

// @desc    Check out for today
// @route   POST /api/attendance/check-out
// @access  Private (employee)
const checkOut = asyncHandler(async (req, res) => {
  const today = normalizeDate(new Date());

  const record = await Attendance.findOne({ employee: req.user._id, date: today });

  if (!record || !record.checkInTime) {
    res.status(400);
    throw new Error('You must check in before checking out');
  }

  if (record.checkOutTime) {
    res.status(400);
    throw new Error('You have already checked out today');
  }

  record.checkOutTime = new Date();
  record.workingHours = calculateWorkingHours(record.checkInTime, record.checkOutTime);
  record.status = deriveStatus(record.workingHours);
  await record.save();

  res.json({ success: true, data: record });
});

// @desc    Get logged-in employee's attendance history (with optional date range)
// @route   GET /api/attendance/my?from=&to=
// @access  Private (employee)
const getMyAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = { employee: req.user._id };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = normalizeDate(from);
    if (to) query.date.$lte = normalizeDate(to);
  }

  const records = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, count: records.length, data: records });
});

// @desc    Get today's attendance status for logged-in employee
// @route   GET /api/attendance/today
// @access  Private (employee)
const getTodayStatus = asyncHandler(async (req, res) => {
  const today = normalizeDate(new Date());
  const record = await Attendance.findOne({ employee: req.user._id, date: today });
  res.json({ success: true, data: record || null });
});

// @desc    Get summary stats (this month) for logged-in employee
// @route   GET /api/attendance/summary
// @access  Private (employee)
const getMySummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

  const records = await Attendance.find({
    employee: req.user._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const summary = {
    totalDaysLogged: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    halfDay: records.filter((r) => r.status === 'Half-Day').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'On-Leave').length,
    totalHours: Math.round(records.reduce((sum, r) => sum + (r.workingHours || 0), 0) * 100) / 100
  };

  res.json({ success: true, data: summary });
});

module.exports = { checkIn, checkOut, getMyAttendance, getTodayStatus, getMySummary };
