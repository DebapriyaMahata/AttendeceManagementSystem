import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function HRDashboard() {
  const [summary, setSummary] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, attendanceRes, leavesRes] = await Promise.all([
        api.get('/hr/dashboard'),
        api.get('/hr/attendance'),
        api.get('/leave/all', { params: { status: 'Pending' } })
      ]);
      setSummary(summaryRes.data.data);
      setTodayAttendance(attendanceRes.data.data);
      setPendingLeaves(leavesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleReview = async (id, decision) => {
    setReviewingId(id);
    setError('');
    setMessage('');
    try {
      await api.put(`/leave/${id}/review`, { decision });
      setMessage(`Leave request ${decision.toLowerCase()}.`);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review leave request');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>HR Dashboard</h1>
          <p className="page-sub">Organization-wide attendance and leave overview</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="stat-grid">
        <StatCard label="Total Active Employees" value={summary?.totalEmployees ?? '—'} accent="blue" />
        <StatCard label="Present Today" value={summary?.today.present ?? '—'} accent="green" />
        <StatCard label="On Leave Today" value={summary?.today.onLeave ?? '—'} accent="purple" />
        <StatCard label="Pending Leave Requests" value={summary?.pendingLeaves ?? '—'} accent="amber" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Pending Leave Requests</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No pending leave requests.
                </td>
              </tr>
            )}
            {pendingLeaves.map((l) => (
              <tr key={l._id}>
                <td>
                  {l.employee?.name}
                  <div className="table-subtext">{l.employee?.employeeId}</div>
                </td>
                <td>
                  {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                </td>
                <td>{l.numberOfDays}</td>
                <td className="table-reason">{l.reason}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={reviewingId === l._id}
                      onClick={() => handleReview(l._id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={reviewingId === l._id}
                      onClick={() => handleReview(l._id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Today's Attendance</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {todayAttendance.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No attendance recorded yet today.
                </td>
              </tr>
            )}
            {todayAttendance.map((r) => (
              <tr key={r._id}>
                <td>
                  {r.employee?.name}
                  <div className="table-subtext">{r.employee?.employeeId}</div>
                </td>
                <td>{r.employee?.department}</td>
                <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{r.workingHours ? `${r.workingHours}h` : '—'}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
