const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { normalizeDate } = require('../utils/calculateHours');

// @desc    List all employees
// @route   GET /api/hr/employees
// @access  Private (HR)
const getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee' }).sort({ name: 1 });
  res.json({ success: true, count: employees.length, data: employees });
});

// @desc    Toggle an employee's active status (enable/disable account)
// @route   PUT /api/hr/employees/:id/status
// @access  Private (HR)
const setEmployeeStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const employee = await User.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }
  employee.isActive = !!isActive;
  await employee.save();
  res.json({ success: true, data: employee });
});

// @desc    Get attendance for all employees on a given date (defaults to today)
// @route   GET /api/hr/attendance?date=YYYY-MM-DD
// @access  Private (HR)
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const day = normalizeDate(req.query.date || new Date());
  const records = await Attendance.find({ date: day }).populate(
    'employee',
    'name employeeId department designation'
  );
  res.json({ success: true, date: day, count: records.length, data: records });
});

// @desc    Get attendance history for a specific employee
// @route   GET /api/hr/attendance/:employeeId?from=&to=
// @access  Private (HR)
const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = { employee: req.params.employeeId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = normalizeDate(from);
    if (to) query.date.$lte = normalizeDate(to);
  }
  const records = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, count: records.length, data: records });
});

// @desc    Org-wide dashboard summary: today's attendance breakdown + pending leaves
// @route   GET /api/hr/dashboard
// @access  Private (HR)
const getDashboardSummary = asyncHandler(async (req, res) => {
  const today = normalizeDate(new Date());

  const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

  const todaysRecords = await Attendance.find({ date: today });
  const present = todaysRecords.filter((r) => r.status === 'Present').length;
  const halfDay = todaysRecords.filter((r) => r.status === 'Half-Day').length;
  const onLeave = todaysRecords.filter((r) => r.status === 'On-Leave').length;
  const checkedInOnly = todaysRecords.filter((r) => r.status === 'Incomplete').length;
  const notCheckedIn = totalEmployees - todaysRecords.length;

  const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

  res.json({
    success: true,
    data: {
      totalEmployees,
      today: {
        present,
        halfDay,
        onLeave,
        checkedInOnly,
        notCheckedIn: notCheckedIn > 0 ? notCheckedIn : 0
      },
      pendingLeaves
    }
  });
});

module.exports = {
  getEmployees,
  setEmployeeStatus,
  getAttendanceByDate,
  getEmployeeAttendance,
  getDashboardSummary
};
