# Employee Attendance Management System

A full-stack MERN application for managing employee attendance, leave, and HR oversight.

## Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React 18 (Vite), React Router, Axios          |
| Backend    | Node.js, Express.js                           |
| Database   | MongoDB (Mongoose ODM)                        |
| Auth       | JWT (JSON Web Tokens), bcrypt password hashing|
| Security   | Helmet, CORS, express-rate-limit, express-validator |

## Features

- **Employee Login & Registration** — JWT-based auth, roles (`employee` / `hr`), HR self-registration protected by a secret signup code.
- **Attendance Check-In / Check-Out** — one record per employee per day, enforced at the database level (unique index).
- **Working Hours Calculation** — computed automatically on check-out from check-in/check-out timestamps.
- **Leave Deduction Calculation** — leave requests deduct from an employee's leave balance only once approved by HR; balance is validated before both request submission and approval.
- **HR Dashboard** — org-wide stats (present/absent/on-leave today, pending leave count), today's attendance table, and a leave approval queue.
- **Employee Dashboard** — check-in/out control, today's status, monthly summary, recent attendance.
- **Attendance Status Tracking** — automatic status derivation: `Present` (≥8h), `Half-Day` (≥4h), `Absent` (<4h), `On-Leave`, `Incomplete` (checked in only).

## Project Structure

```
attendance-system/
├── backend/                 # Express REST API
│   ├── config/db.js         # MongoDB connection
│   ├── models/              # Mongoose schemas: User, Attendance, Leave
│   ├── middleware/          # auth (JWT), role (RBAC), errorHandler
│   ├── controllers/         # Business logic
│   ├── routes/              # Express routers
│   ├── utils/calculateHours.js  # Working-hours & leave-day math
│   ├── scripts/seed.js      # Demo data seeder
│   └── server.js            # App entry point
├── frontend/                 # React SPA
│   └── src/
│       ├── api/axios.js     # Axios instance + JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/      # Navbar, ProtectedRoute, StatCard, StatusBadge
│       ├── pages/           # Login, Register, EmployeeDashboard, HRDashboard, ...
│       └── styles/index.css
├── database/
│   └── schema-and-notes.md  # ERD & collection reference (MongoDB is schemaless; see Mongoose models for the authoritative schema)
└── docs/
    └── API.md               # Full REST API reference
```

## Prerequisites

- Node.js ≥ 18
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string
- npm ≥ 9

## Setup Instructions

### 1. Backend

```bash
cd backend
cp .env.example .env      # then edit values as needed (JWT_SECRET, MONGO_URI, HR_SIGNUP_CODE)
npm install
npm run seed               # optional: populate demo HR + employee accounts
npm run dev                 # starts on http://localhost:5000
```

Demo accounts created by `npm run seed`:

| Role     | Email              | Password      |
|----------|--------------------|---------------|
| HR       | hr@company.com     | hr123456      |
| Employee | amit@company.com   | employee123   |
| Employee | sara@company.com   | employee123   |
| Employee | rohan@company.com  | employee123   |
| Employee | neha@company.com   | employee123   |

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # points to the backend API, defaults to http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. Log in with a seeded account, or register a new one.

> To register as HR yourself, select "HR Manager" on the registration form and enter the `HR_SIGNUP_CODE` value set in `backend/.env`.

### 3. Production build (frontend)

```bash
cd frontend
npm run build      # outputs static assets to frontend/dist
npm run preview    # serve the production build locally
```

## Business Rules

- **Working hours**: `checkOutTime - checkInTime`, in decimal hours, rounded to 2 decimals.
- **Status thresholds** (configurable via `.env`):
  - `Present`: ≥ `FULL_DAY_MIN_HOURS` (default 8h)
  - `Half-Day`: ≥ `HALF_DAY_MIN_HOURS` (default 4h)
  - `Absent`: below half-day threshold
  - `On-Leave`: set automatically across the date range when HR approves a leave request
  - `Incomplete`: checked in, not yet checked out
- **Leave deduction**: a leave request specifies a date range; `numberOfDays` is the inclusive day count. Balance is checked (a) when the employee submits the request and (b) again when HR approves it (in case balance changed in the interim). Balance is only deducted on **approval**, not on submission.
- **One attendance record per employee per day**, enforced by a unique compound index (`employee`, `date`) in MongoDB.
- **HR self-registration** requires a shared secret (`HR_SIGNUP_CODE`) so employees cannot elevate their own role.

## Security Notes

- Passwords hashed with bcrypt (10 salt rounds), never returned in API responses.
- JWT tokens expire after 8 hours by default (`JWT_EXPIRES_IN`).
- Role-based access control middleware (`authorize('hr')`) protects all HR-only routes.
- `helmet` sets secure HTTP headers; `express-rate-limit` throttles auth endpoints against brute-force attempts.
- Input validation via `express-validator` on all write endpoints.
- CORS restricted to the configured `CLIENT_URL`.

## API Documentation

See [`docs/API.md`](./docs/API.md) for the full endpoint reference.

## Database Design

See [`database/schema-and-notes.md`](./database/schema-and-notes.md) for the entity-relationship overview and indexing strategy.

## Possible Future Enhancements

- Password reset via email
- Pagination on attendance/leave history endpoints for large datasets
- Configurable shift timings per department
- Export attendance/leave reports to CSV/PDF
- Automated "Absent" marking for employees who never check in on a given day (currently a day with no record simply doesn't appear in history; a scheduled job could backfill `Absent` records)
