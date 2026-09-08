import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [todayRes, summaryRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/summary'),
        api.get('/attendance/my')
      ]);
      setToday(todayRes.data.data);
      setSummary(summaryRes.data.data);
      setRecent(historyRes.data.data.slice(0, 7));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/attendance/check-in');
      setMessage('Checked in successfully!');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/attendance/check-out');
      setMessage('Checked out successfully!');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const hasCheckedIn = !!today?.checkInTime;
  const hasCheckedOut = !!today?.checkOutTime;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="page-sub">
            {user.designation} · {user.department} · {user.employeeId}
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/leave" className="btn btn-outline">
            Apply for Leave
          </Link>
          <Link to="/history" className="btn btn-outline">
            Full History
          </Link>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="checkin-card">
        <div className="checkin-info">
          <div className="checkin-label">Today's Status</div>
          <div className="checkin-times">
            <div>
              <span className="checkin-times-label">Check-in</span>
              <span className="checkin-times-value">{formatTime(today?.checkInTime)}</span>
            </div>
            <div>
              <span className="checkin-times-label">Check-out</span>
              <span className="checkin-times-value">{formatTime(today?.checkOutTime)}</span>
            </div>
            <div>
              <span className="checkin-times-label">Status</span>
              <span>{today ? <StatusBadge status={today.status} /> : <StatusBadge status="Incomplete" />}</span>
            </div>
          </div>
        </div>
        <div className="checkin-actions">
          <button
            className="btn btn-primary"
            onClick={handleCheckIn}
            disabled={actionLoading || hasCheckedIn}
          >
            Check In
          </button>
          <button
            className="btn btn-danger"
            onClick={handleCheckOut}
            disabled={actionLoading || !hasCheckedIn || hasCheckedOut}
          >
            Check Out
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Leave Balance" value={`${user.leaveBalance} days`} accent="purple" />
        <StatCard label="Present Days (Month)" value={summary?.present ?? '—'} accent="green" />
        <StatCard label="Half Days (Month)" value={summary?.halfDay ?? '—'} accent="amber" />
        <StatCard label="Total Hours (Month)" value={summary ? `${summary.totalHours}h` : '—'} accent="blue" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Recent Attendance</h2>
          <Link to="/history" className="link">
            View all →
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No attendance records yet.
                </td>
              </tr>
            )}
            {recent.map((r) => (
              <tr key={r._id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{formatTime(r.checkInTime)}</td>
                <td>{formatTime(r.checkOutTime)}</td>
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
