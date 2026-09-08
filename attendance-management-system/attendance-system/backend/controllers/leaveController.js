const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { calculateLeaveDays, normalizeDate } = require('../utils/calculateHours');

// @desc    Apply for leave
// @route   POST /api/leave/apply
// @access  Private (employee)
const applyLeave = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }

  const { startDate, endDate, reason } = req.body;
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (end < start) {
    res.status(400);
    throw new Error('End date cannot be before start date');
  }

  const numberOfDays = calculateLeaveDays(start, end);

  // Ensure sufficient leave balance before allowing the request
  const user = await User.findById(req.user._id);
  if (numberOfDays > user.leaveBalance) {
    res.status(400);
    throw new Error(
      `Insufficient leave balance. Requested ${numberOfDays} day(s), available ${user.leaveBalance} day(s)`
    );
  }

  const leave = await Leave.create({
    employee: req.user._id,
    startDate: start,
    endDate: end,
    numberOfDays,
    reason
  });

  res.status(201).json({ success: true, data: leave });
});

// @desc    Get logged-in employee's leave requests
// @route   GET /api/leave/my
// @access  Private (employee)
const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: leaves.length, data: leaves });
});

// @desc    Cancel a pending leave request
// @route   DELETE /api/leave/:id
// @access  Private (employee - own pending leave only)
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  if (leave.employee.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this leave request');
  }
  if (leave.status !== 'Pending') {
    res.status(400);
    throw new Error('Only pending leave requests can be cancelled');
  }
  await leave.deleteOne();
  res.json({ success: true, message: 'Leave request cancelled' });
});

// @desc    Get all leave requests (optionally filter by status)
// @route   GET /api/leave/all?status=Pending
// @access  Private (HR)
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const leaves = await Leave.find(query)
    .populate('employee', 'name employeeId email department')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: leaves.length, data: leaves });
});

// @desc    Approve or reject a leave request; deducts leave balance on approval
// @route   PUT /api/leave/:id/review
// @access  Private (HR)
const reviewLeave = asyncHandler(async (req, res) => {
  const { decision, reviewNote } = req.body; // decision: 'Approved' | 'Rejected'

  if (!['Approved', 'Rejected'].includes(decision)) {
    res.status(400);
    throw new Error("Decision must be either 'Approved' or 'Rejected'");
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  if (leave.status !== 'Pending') {
    res.status(400);
    throw new Error('This leave request has already been reviewed');
  }

  const employee = await User.findById(leave.employee);
  if (!employee) {
    res.status(404);
    throw new Error('Associated employee not found');
  }

  if (decision === 'Approved') {
    if (leave.numberOfDays > employee.leaveBalance) {
      res.status(400);
      throw new Error('Employee no longer has sufficient leave balance to approve this request');
    }
    // Deduct leave balance
    employee.leaveBalance -= leave.numberOfDays;
    await employee.save();

    // Mark attendance records across the leave range as 'On-Leave'
    const cursor = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const bulkOps = [];
    while (cursor <= end) {
      const day = normalizeDate(cursor);
      bulkOps.push({
        updateOne: {
          filter: { employee: employee._id, date: day },
          update: { $set: { status: 'On-Leave' } },
          upsert: true
        }
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (bulkOps.length) {
      await Attendance.bulkWrite(bulkOps);
    }
  }

  leave.status = decision;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  leave.reviewNote = reviewNote || '';
  await leave.save();

  res.json({ success: true, data: leave });
});

module.exports = { applyLeave, getMyLeaves, cancelLeave, getAllLeaves, reviewLeave };
