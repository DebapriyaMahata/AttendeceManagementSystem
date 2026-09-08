import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    role: 'employee',
    hrSignupCode: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await register(form);
      navigate(userData.role === 'hr' ? '/hr' : '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">⏱</div>
        <h1>Create your account</h1>
        <p className="auth-sub">Register as an employee or HR manager</p>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label className="form-label">
              Full Name
              <input
                type="text"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-label">
              Email
              <input
                type="email"
                name="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              Department
              <input
                type="text"
                name="department"
                className="form-input"
                placeholder="Engineering"
                value={form.department}
                onChange={handleChange}
              />
            </label>
            <label className="form-label">
              Designation
              <input
                type="text"
                name="designation"
                className="form-input"
                placeholder="Software Engineer"
                value={form.designation}
                onChange={handleChange}
              />
            </label>
          </div>

          <label className="form-label">
            Password
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Account Type
            <select name="role" className="form-input" value={form.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="hr">HR Manager</option>
            </select>
          </label>

          {form.role === 'hr' && (
            <label className="form-label">
              HR Signup Code
              <input
                type="password"
                name="hrSignupCode"
                className="form-input"
                placeholder="Provided by your organization"
                value={form.hrSignupCode}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
