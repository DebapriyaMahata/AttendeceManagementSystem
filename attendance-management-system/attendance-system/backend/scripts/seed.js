/**
 * Seed script - populates the database with a demo HR account,
 * a handful of demo employees, and some sample attendance history.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { normalizeDate, calculateWorkingHours, deriveStatus } = require('../utils/calculateHours');

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Attendance.deleteMany({}), Leave.deleteMany({})]);

  console.log('Creating HR account...');
  const hr = await User.create({
    employeeId: 'EMP0001',
    name: 'Priya Sharma',
    email: 'hr@company.com',
    password: 'hr123456',
    role: 'hr',
    department: 'Human Resources',
    designation: 'HR Manager',
    leaveBalance: 24
  });

  console.log('Creating demo employees...');
  const employeesData = [
    { name: 'Amit Verma', email: 'amit@company.com', department: 'Engineering', designation: 'Software Engineer' },
    { name: 'Sara Khan', email: 'sara@company.com', department: 'Engineering', designation: 'QA Engineer' },
    { name: 'Rohan Gupta', email: 'rohan@company.com', department: 'Sales', designation: 'Sales Executive' },
    { name: 'Neha Singh', email: 'neha@company.com', department: 'Marketing', designation: 'Marketing Associate' }
  ];

  const employees = [];
  for (let i = 0; i < employeesData.length; i++) {
    const e = employeesData[i];
    const user = await User.create({
      employeeId: `EMP${String(i + 2).padStart(4, '0')}`,
      name: e.name,
      email: e.email,
      password: 'employee123',
      role: 'employee',
      department: e.department,
      designation: e.designation,
      leaveBalance: 24
    });
    employees.push(user);
  }

  console.log('Creating sample attendance for the past 5 days...');
  const today = normalizeDate(new Date());
  for (const emp of employees) {
    for (let dayOffset = 5; dayOffset >= 1; dayOffset--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - dayOffset);

      // Skip weekends for realism
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue;

      const checkIn = new Date(day);
      checkIn.setUTCHours(9, Math.floor(Math.random() * 30), 0, 0);

      const checkOut = new Date(day);
      const workHourVariant = 6 + Math.random() * 3; // 6-9 hours
      checkOut.setUTCHours(9 + Math.floor(workHourVariant), Math.floor(Math.random() * 59), 0, 0);

      const workingHours = calculateWorkingHours(checkIn, checkOut);
      const status = deriveStatus(workingHours);

      await Attendance.create({
        employee: emp._id,
        date: day,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        workingHours,
        status
      });
    }
  }

  console.log('Creating a sample pending leave request...');
  const sampleStart = new Date(today);
  sampleStart.setUTCDate(sampleStart.getUTCDate() + 3);
  const sampleEnd = new Date(sampleStart);
  sampleEnd.setUTCDate(sampleEnd.getUTCDate() + 1);

  await Leave.create({
    employee: employees[0]._id,
    startDate: sampleStart,
    endDate: sampleEnd,
    numberOfDays: 2,
    reason: 'Personal work',
    status: 'Pending'
  });

  console.log('\n✅ Seed complete!\n');
  console.log('HR login:       hr@company.com / hr123456');
  console.log('Employee login: amit@company.com / employee123 (also sara@, rohan@, neha@)');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
