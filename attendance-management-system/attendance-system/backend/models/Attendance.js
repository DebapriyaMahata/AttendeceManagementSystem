const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      // normalized to midnight UTC - represents the calendar day of attendance
      type: Date,
      required: true
    },
    checkInTime: {
      type: Date,
      default: null
    },
    checkOutTime: {
      type: Date,
      default: null
    },
    workingHours: {
      // computed on checkout, in decimal hours e.g. 7.5
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Present', 'Half-Day', 'Absent', 'On-Leave', 'Incomplete'],
      default: 'Incomplete'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// One attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
