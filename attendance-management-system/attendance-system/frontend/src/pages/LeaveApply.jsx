import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function LeaveApply() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLeaves = useCallback(async () => {
    try {
      const { data } = await api.get('/leave/my');
      setLeaves(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/leave/apply', form);
      setMessage('Leave request submitted successfully!');
      setForm({ startDate: '', endDate: '', reason: '' });
      await loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.delete(`/leave/${id}`);
      await loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p className="page-sub">
            Available balance: <strong>{user.leaveBalance} days</strong>
          </p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h2>Apply for Leave</h2>
          </div>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label className="form-label">
                Start Date
                <input
                  type="date"
                  name="startDate"
                  className="form-input"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-label">
                End Date
                <input
                  type="date"
                  name="endDate"
                  className="form-input"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <label className="form-label">
              Reason
              <textarea
                name="reason"
                className="form-input"
                rows={3}
                placeholder="Briefly describe the reason for leave"
                value={form.reason}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>My Leave Requests</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-empty">
                    No leave requests yet.
                  </td>
                </tr>
              )}
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td>
                    {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td>{l.numberOfDays}</td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td>
                    {l.status === 'Pending' && (
                      <button className="btn btn-link-danger" onClick={() => handleCancel(l._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
