const express = require('express');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getMySummary
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);
router.get('/today', getTodayStatus);
router.get('/summary', getMySummary);

module.exports = router;
