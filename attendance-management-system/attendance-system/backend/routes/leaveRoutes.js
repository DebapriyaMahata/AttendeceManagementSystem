const express = require('express');
const { body } = require('express-validator');
const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  reviewLeave
} = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post(
  '/apply',
  [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
  ],
  applyLeave
);

router.get('/my', getMyLeaves);
router.delete('/:id', cancelLeave);

// HR-only
router.get('/all', authorize('hr'), getAllLeaves);
router.put('/:id/review', authorize('hr'), reviewLeave);

module.exports = router;
