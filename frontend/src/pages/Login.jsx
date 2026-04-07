import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth';

function Orb({ style }) {
  return <div aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', ...style }} />;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  const registeredUsername = location.state?.username || '';

  const [form, setForm] = useState({ username: registeredUsername, password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await loginApi(form);
      if (res.success) {
        login(res.data.token);
        const redirect = { CUSTOMER: '/customer/dashboard', PROVIDER: '/provider/dashboard', ADMIN: '/admin/dashboard' };
        navigate(redirect[res.data.user.role] || '/');
      } else {
        setApiError(res.error?.message || 'Login failed');
      }
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '2rem 1rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* bg orbs */}
      <Orb style={{ width: '400px', height: '400px', top: '-100px', right: '-100px', background: 'radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)' }} />
      <Orb style={{ width: '300px', height: '300px', bottom: '-80px', left: '-80px', background: 'radial-gradient(circle,rgba(0,245,160,0.12) 0%,transparent 70%)', animation: 'float-b 14s ease-in-out infinite' }} />

      {/* subtle grid */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1, animation: 'fade-in-up 0.5s ease both' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'Syne,sans-serif', fontSize: '1.4rem', fontWeight: 800,
            background: 'linear-gradient(135deg,#A78BFA,#00F5A0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            <img src="/logo.png" alt="ServeMart" style={{ height: '28px', width: 'auto' }} />
            ServeMart
          </Link>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Sign in to your account
          </p>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(25,28,51,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.08)',
        }}>
          <h2 style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.75rem' }}>Enter your credentials to continue</p>

          {registered && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--success)', borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <FiCheckCircle /> Account created! Sign in to continue.
            </div>
          )}

          {apiError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#F87171', borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
            }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className={`form-input${errors.username ? ' error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="your_username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem',
                }}>
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white', borderRightColor: 'var(--accent-mint)' }} /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            No account?{' '}
            <Link to="/register/customer" style={{ color: 'var(--accent-mint)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
