import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="logo">CryptoSim</span>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </div>
      <div className="navbar-right">
        {user && <span className="user-name">{user.name}</span>}
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </div>
    </header>
  );
}
