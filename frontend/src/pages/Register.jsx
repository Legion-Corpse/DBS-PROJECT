import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { FaUserTie, FaHardHat } from 'react-icons/fa';
import { register as registerApi } from '../api/auth';

function Orb({ style }) {
  return <div aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', ...style }} />;
}

export default function Register({ type }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(type || 'CUSTOMER');

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (form.username.length < 3) e.username = 'Min 3 characters';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...payloadWithoutRole } = form;
      const payload = { ...payloadWithoutRole, role };
      const res = await registerApi(payload);
      if (res.success) {
        navigate('/login', { state: { registered: true, username: form.username, role } });
      } else {
        setApiError(res.error?.message || 'Registration failed');
      }
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  const f = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });

  const isPro = role === 'PROVIDER';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '4rem 1rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background Orbs */}
      <Orb style={{ 
        width: '460px', height: '460px', top: '-140px', left: '-100px', 
        background: isPro 
          ? 'radial-gradient(circle,rgba(0,245,160,0.18) 0%,transparent 70%)' 
          : 'radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)' 
      }} />
      <Orb style={{ 
        width: '320px', height: '320px', bottom: '-100px', right: '-80px', 
        background: isPro 
          ? 'radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)' 
          : 'radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)' 
      }} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1, animation: 'fade-in-up 0.5s ease both' }}>
        
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: 'Syne,sans-serif', fontSize: '1.25rem', fontWeight: 800,
            background: 'linear-gradient(135deg,#A78BFA,#00F5A0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            <FiZap size={22} style={{ color: '#A78BFA' }} /> ServeMart
          </Link>
        </div>

        {/* The Card */}
        <div style={{
          background: 'rgba(25,28,51,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${isPro ? 'rgba(0,245,160,0.08)' : 'rgba(124,58,237,0.08)'}`,
          transition: 'all 0.4s ease',
        }}>
          
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>Create your account</h2>

          {/* Role Toggle Switcher */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '999px',
            padding: '4px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            marginBottom: '2rem',
            position: 'relative',
          }}>
            <button 
              onClick={() => setRole('CUSTOMER')}
              style={{
                background: !isPro ? 'var(--accent-violet)' : 'transparent',
                color: !isPro ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: '999px', padding: '0.625rem', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              <FaUserTie /> Hire a Pro
            </button>
            <button 
              onClick={() => setRole('PROVIDER')}
              style={{
                background: isPro ? 'var(--accent-mint)' : 'transparent',
                color: isPro ? '#0D0F1A' : 'var(--text-muted)',
                border: 'none', borderRadius: '999px', padding: '0.625rem', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              <FaHardHat /> Join as Pro
            </button>
          </div>

          <p style={{ fontSize: '0.875rem', marginBottom: '1.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {isPro 
              ? 'Start offering your professional services and grow your client base.' 
              : 'Sign up to browse, book, and review the best local professionals.'
            }
          </p>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className={`form-input${errors.firstName ? ' error' : ''}`} placeholder="John" {...f('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className={`form-input${errors.lastName ? ' error' : ''}`} placeholder="Doe" {...f('lastName')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className={`form-input${errors.username ? ' error' : ''}`} style={{ paddingLeft: '2.5rem' }} placeholder="johndoe123" {...f('username')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="email" className={`form-input${errors.email ? ' error' : ''}`} style={{ paddingLeft: '2.5rem' }} placeholder="john@example.com" {...f('email')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <FiPhone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="+91 9876543210" {...f('phone')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                  placeholder="Min 6 characters"
                  {...f('password')}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="password" className={`form-input${errors.confirmPassword ? ' error' : ''}`} style={{ paddingLeft: '2.5rem' }} placeholder="Repeat password" {...f('confirmPassword')} />
              </div>
            </div>

            <button
              type="submit"
              className={isPro ? 'btn btn-mint' : 'btn btn-primary'}
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner spinner-sm" style={{ borderTopColor: isPro ? '#0D0F1A' : '#FFF' }} /> Creating account...</>
                : (isPro ? 'Join as Professional' : 'Complete Signup')
              }
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
