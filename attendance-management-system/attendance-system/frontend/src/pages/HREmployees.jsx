import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

export default function HREmployees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/hr/employees');
      setEmployees(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (emp) => {
    setBusyId(emp._id);
    try {
      await api.put(`/hr/employees/${emp._id}/status`, { isActive: !emp.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-sub">Manage employee accounts and view leave balances</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Leave Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No employees found.
                </td>
              </tr>
            )}
            {employees.map((e) => (
              <tr key={e._id}>
                <td>
                  {e.name}
                  <div className="table-subtext">
                    {e.employeeId} · {e.email}
                  </div>
                </td>
                <td>{e.department}</td>
                <td>{e.designation}</td>
                <td>{e.leaveBalance} days</td>
                <td>
                  <span className={`badge ${e.isActive ? 'badge--green' : 'badge--red'}`}>
                    {e.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={busyId === e._id}
                    onClick={() => toggleStatus(e)}
                  >
                    {e.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
