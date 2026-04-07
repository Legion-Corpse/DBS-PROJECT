import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiZap } from 'react-icons/fi';

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const roleLinks = {
    CUSTOMER: [
      { to: '/customer/dashboard', label: 'Home' },
      { to: '/customer/browse',    label: 'Browse' },
      { to: '/customer/bookings',  label: 'Bookings' },
    ],
    PROVIDER: [
      { to: '/provider/dashboard', label: 'Dashboard' },
      { to: '/provider/services',  label: 'My Services' },
      { to: '/provider/slots',     label: 'My Slots' },
      { to: '/provider/areas',     label: 'My Areas' },
    ],
    ADMIN: [
      { to: '/admin/dashboard',  label: 'Revenue' },
      { to: '/admin/providers',  label: 'Providers' },
      { to: '/admin/errors',     label: 'Error Logs' },
    ],
  };

  const links = user ? roleLinks[user.user_role] || [] : [];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <FiZap size={20} style={{ color: '#A78BFA', flexShrink: 0 }} />
          ServeMart
        </Link>

        {/* Links */}
        <div className="navbar-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          {!user && (
            <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Home
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <div className="navbar-user-pill">
                <div className="navbar-avatar">{getInitials(user.username)}</div>
                <span className="navbar-username">{user.username}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
                title="Logout"
                style={{ padding: '0.4rem 0.75rem' }}
              >
                <FiLogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/register/provider" className="nav-link" style={{ fontSize: '0.82rem', borderRight: '1px solid var(--border-subtle)', paddingRight: '1rem', marginRight: '0.5rem' }}>For Professionals</Link>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register/customer" className="btn btn-mint btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
