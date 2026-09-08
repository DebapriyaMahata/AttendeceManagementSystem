const FULL_DAY_MIN_HOURS = parseFloat(process.env.FULL_DAY_MIN_HOURS || '8');
const HALF_DAY_MIN_HOURS = parseFloat(process.env.HALF_DAY_MIN_HOURS || '4');

/**
 * Calculates decimal working hours between check-in and check-out.
 * @param {Date} checkInTime
 * @param {Date} checkOutTime
 * @returns {number} hours rounded to 2 decimal places
 */
function calculateWorkingHours(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) return 0;
  const diffMs = new Date(checkOutTime) - new Date(checkInTime);
  if (diffMs <= 0) return 0;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Derives attendance status from working hours.
 * @param {number} workingHours
 * @returns {'Present'|'Half-Day'|'Absent'}
 */
function deriveStatus(workingHours) {
  if (workingHours >= FULL_DAY_MIN_HOURS) return 'Present';
  if (workingHours >= HALF_DAY_MIN_HOURS) return 'Half-Day';
  return 'Absent';
}

/**
 * Normalizes a date to midnight UTC, used as the "day key" for attendance.
 * @param {Date|string} date
 */
function normalizeDate(date) {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Computes leave deduction for a leave request.
 * Simple inclusive day-count between start and end dates.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number} number of leave days
 */
function calculateLeaveDays(startDate, endDate) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

module.exports = {
  calculateWorkingHours,
  deriveStatus,
  normalizeDate,
  calculateLeaveDays,
  FULL_DAY_MIN_HOURS,
  HALF_DAY_MIN_HOURS
};
