# API Reference

Base URL: `http://localhost:5000/api`

All authenticated endpoints require a header:
```
Authorization: Bearer <jwt_token>
```

Responses follow the shape `{ success: boolean, data?: ..., message?: string, count?: number }`.

---

## Auth

### POST `/auth/register`
Register a new employee (or HR, with a valid `hrSignupCode`).

**Body**
```json
{
  "name": "Amit Verma",
  "email": "amit@company.com",
  "password": "employee123",
  "department": "Engineering",
  "designation": "Software Engineer",
  "role": "employee"
}
```
For HR: add `"role": "hr"` and `"hrSignupCode": "<value from backend .env>"`.

**Response 201** — user object + JWT `token`.

### POST `/auth/login`
**Body**: `{ "email": "...", "password": "..." }`
**Response 200** — user object + JWT `token`.

### GET `/auth/me`
Returns the logged-in user's profile. *(Auth required)*

---

## Attendance *(Auth required — employee)*

### POST `/attendance/check-in`
Records check-in for today. Fails if already checked in today.

### POST `/attendance/check-out`
Records check-out for today, computes `workingHours` and `status`. Fails if not checked in, or already checked out.

### GET `/attendance/today`
Returns today's attendance record for the logged-in user (or `null`).

### GET `/attendance/my?from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns the logged-in user's attendance history, optionally filtered by date range.

### GET `/attendance/summary`
Returns the current calendar month's aggregate stats: `present`, `halfDay`, `absent`, `onLeave`, `totalHours`.

---

## Leave *(Auth required)*

### POST `/leave/apply` — *employee*
**Body**
```json
{ "startDate": "2026-09-10", "endDate": "2026-09-11", "reason": "Family event" }
```
Validates that `numberOfDays` does not exceed the employee's current leave balance.

### GET `/leave/my` — *employee*
Returns the logged-in employee's own leave requests.

### DELETE `/leave/:id` — *employee*
Cancels a **pending** leave request owned by the logged-in employee.

### GET `/leave/all?status=Pending` — *HR only*
Lists all leave requests across the org, optionally filtered by status (`Pending`/`Approved`/`Rejected`).

### PUT `/leave/:id/review` — *HR only*
**Body**: `{ "decision": "Approved" | "Rejected", "reviewNote": "optional text" }`

On **approval**: deducts `numberOfDays` from the employee's `leaveBalance` and marks the corresponding attendance records as `On-Leave`. Re-validates balance at approval time in case it changed since submission.

---

## HR *(Auth required — HR role only)*

### GET `/hr/dashboard`
Org-wide summary: total active employees, today's attendance breakdown (present/half-day/on-leave/checked-in-only/not-checked-in), and pending leave count.

### GET `/hr/employees`
Lists all employees (role = `employee`).

### PUT `/hr/employees/:id/status`
**Body**: `{ "isActive": true | false }` — enable/disable an employee account (disabled users cannot log in).

### GET `/hr/attendance?date=YYYY-MM-DD`
Attendance for all employees on a given date (defaults to today).

### GET `/hr/attendance/:employeeId?from=&to=`
Attendance history for a single employee.

---

## Error Format

```json
{ "success": false, "message": "Human-readable error description" }
```

Common status codes: `400` (validation), `401` (auth), `403` (forbidden/role), `404` (not found), `500` (server error).
