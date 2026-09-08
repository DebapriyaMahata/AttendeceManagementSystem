import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get('/attendance/my', { params });
      setRecords(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance History</h1>
          <p className="page-sub">Complete record of your check-ins and check-outs</p>
        </div>
      </div>

      <div className="filter-bar">
        <label className="form-label form-label--inline">
          From
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="form-label form-label--inline">
          To
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button className="btn btn-outline" onClick={() => { setFrom(''); setTo(''); }}>
          Clear
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="panel">
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
            {loading && (
              <tr>
                <td colSpan={5} className="table-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No records found for this range.
                </td>
              </tr>
            )}
            {records.map((r) => (
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
