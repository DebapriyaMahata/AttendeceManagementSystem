# Database Design

MongoDB is schemaless, but the application enforces structure at the application layer via
Mongoose schemas (see `backend/models/`). This document summarizes the data model, relationships,
and indexing strategy — effectively the ERD for this system.

## Collections

### `users`
Stores both employees and HR managers (differentiated by `role`).

| Field          | Type     | Notes                                              |
|----------------|----------|-----------------------------------------------------|
| `_id`          | ObjectId | Primary key                                         |
| `employeeId`   | String   | Unique, auto-generated (`EMP0001`, `EMP0002`, ...)   |
| `name`         | String   | Required                                             |
| `email`        | String   | Required, unique, lowercase                          |
| `password`     | String   | Hashed with bcrypt, never returned in API responses  |
| `role`         | String   | `employee` \| `hr`                                   |
| `department`   | String   | Default `"General"`                                  |
| `designation`  | String   | Default `"Staff"`                                    |
| `dateOfJoining`| Date     | Default: creation date                               |
| `leaveBalance` | Number   | Default 24 days; decremented on leave approval        |
| `isActive`     | Boolean  | HR can disable an account without deleting it         |
| `createdAt` / `updatedAt` | Date | Timestamps (Mongoose auto-managed)         |

### `attendances`
One record per employee per calendar day.

| Field          | Type     | Notes                                              |
|----------------|----------|-----------------------------------------------------|
| `_id`          | ObjectId | Primary key                                         |
| `employee`     | ObjectId | References `users._id`                               |
| `date`         | Date     | Normalized to midnight UTC — the "day key"           |
| `checkInTime`  | Date     | Nullable                                             |
| `checkOutTime` | Date     | Nullable                                             |
| `workingHours` | Number   | Decimal hours, computed on check-out                 |
| `status`       | String   | `Present` \| `Half-Day` \| `Absent` \| `On-Leave` \| `Incomplete` |
| `notes`        | String   | Optional free text                                   |

**Index**: unique compound index on `{ employee: 1, date: 1 }` — guarantees at most one
attendance record per employee per day at the database level (not just application logic).

### `leaves`
Leave requests submitted by employees, reviewed by HR.

| Field          | Type     | Notes                                              |
|----------------|----------|-----------------------------------------------------|
| `_id`          | ObjectId | Primary key                                         |
| `employee`     | ObjectId | References `users._id`                               |
| `startDate`    | Date     | Inclusive                                            |
| `endDate`      | Date     | Inclusive                                            |
| `numberOfDays` | Number   | Computed as inclusive day count between start/end     |
| `reason`       | String   | Required                                             |
| `status`       | String   | `Pending` \| `Approved` \| `Rejected`                 |
| `reviewedBy`   | ObjectId | References `users._id` (the HR reviewer), nullable    |
| `reviewedAt`   | Date     | Nullable                                              |
| `reviewNote`   | String   | Optional HR comment                                   |

## Entity-Relationship Diagram (textual)

```
┌────────────────┐        1        N ┌────────────────────┐
│     users       │ ─────────────────▶│    attendances      │
│ (employee / hr)  │                   │ (per employee/day)  │
└────────────────┘                    └────────────────────┘
        │ 1
        │
        │ N
        ▼
┌────────────────────┐
│       leaves         │
│ employee ──▶ users    │
│ reviewedBy ──▶ users  │ (HR reviewer, optional self-reference)
└────────────────────┘
```

- **users → attendances**: one-to-many. Each attendance record belongs to exactly one user.
- **users → leaves**: one-to-many (as the requester). Each leave request belongs to exactly one
  employee.
- **users → leaves**: one-to-many (as `reviewedBy`), a second, optional relationship representing
  which HR user approved/rejected the request.

## Why MongoDB for this system

- Attendance and leave data are naturally document-shaped (no complex joins needed for the core
  workflows — check-in/out, leave apply/review are single-document writes).
- Mongoose schemas + validators give the relational-style guarantees (required fields, enums,
  unique indexes) that this system needs, while keeping the flexibility to extend fields later
  (e.g. adding shift timings, geofencing metadata) without a migration.
- The unique compound index on `attendances` is the key relational-integrity guarantee that
  replaces what a SQL `UNIQUE(employee_id, date)` constraint would provide.

## Equivalent relational (SQL) schema, if preferred

If a relational database were used instead, the equivalent DDL would be:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'employee',
  department VARCHAR(100) DEFAULT 'General',
  designation VARCHAR(100) DEFAULT 'Staff',
  date_of_joining DATE DEFAULT CURRENT_DATE,
  leave_balance INT DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendances (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  working_hours NUMERIC(4,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Incomplete',
  notes TEXT,
  UNIQUE (employee_id, date)
);

CREATE TABLE leaves (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(10) DEFAULT 'Pending',
  reviewed_by INT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Seeding

Run `npm run seed` from `backend/` to populate:
- 1 HR account
- 4 employee accounts across different departments
- ~5 days of realistic sample attendance history per employee (weekends skipped)
- 1 sample pending leave request

See `backend/scripts/seed.js` for the full script.
