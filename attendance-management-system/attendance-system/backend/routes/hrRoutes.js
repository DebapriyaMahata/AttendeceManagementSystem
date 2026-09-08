const express = require('express');
const {
  getEmployees,
  setEmployeeStatus,
  getAttendanceByDate,
  getEmployeeAttendance,
  getDashboardSummary
} = require('../controllers/hrController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect, authorize('hr'));

router.get('/dashboard', getDashboardSummary);
router.get('/employees', getEmployees);
router.put('/employees/:id/status', setEmployeeStatus);
router.get('/attendance', getAttendanceByDate);
router.get('/attendance/:employeeId', getEmployeeAttendance);

module.exports = router;
