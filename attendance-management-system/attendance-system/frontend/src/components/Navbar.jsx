import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⏱</span>
        <span>Attendance System</span>
      </div>

      <nav className="navbar-links">
        {user.role === 'hr' ? (
          <>
            <Link to="/hr">Dashboard</Link>
            <Link to="/hr/employees">Employees</Link>
          </>
        ) : (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/history">History</Link>
            <Link to="/leave">Leave</Link>
          </>
        )}
      </nav>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user.name}</span>
          <span className="navbar-user-role">{user.role === 'hr' ? 'HR Manager' : user.employeeId}</span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
