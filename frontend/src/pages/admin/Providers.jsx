import { useEffect, useState, useCallback } from 'react';
import { FiRefreshCw, FiCheckCircle, FiClock, FiXCircle, FiUser, FiMail } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';
import { getAdminProviders, approveProvider } from '../../api/admin';

function statusBadge(status) {
  const map = {
    PENDING:  { cls: 'badge-pending',   icon: <FiClock />,       label: 'Pending' },
    APPROVED: { cls: 'badge-completed', icon: <FiCheckCircle />, label: 'Approved' },
    REJECTED: { cls: 'badge-cancelled', icon: <FiXCircle />,     label: 'Rejected' },
  };
  return map[status] || map.PENDING;
}

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [approving, setApproving] = useState(null);
  const [filter, setFilter]       = useState('ALL');

  const fetchProviders = useCallback(() => {
    setLoading(true);
    getAdminProviders()
      .then((res) => {
        if (res.success) setProviders(res.data);
        else setError(res.error?.message || 'Failed to load providers');
      })
      .catch(() => setError('Network error — is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  async function handleApprove(providerId, providerName) {
    setApproving(providerId);
    try {
      const res = await approveProvider(providerId);
      if (res.success) {
        setSuccess(`${providerName} has been approved.`);
        fetchProviders();
      } else {
        setError(res.error?.message || 'Approval failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Approval failed');
    } finally {
      setApproving(null);
    }
  }

  const counts = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].reduce((acc, s) => {
    acc[s] = s === 'ALL'
      ? providers.length
      : providers.filter((p) => (p.BACKGROUND_CHK || p.background_chk) === s).length;
    return acc;
  }, {});

  const filtered = filter === 'ALL'
    ? providers
    : providers.filter((p) => (p.BACKGROUND_CHK || p.background_chk) === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-mint)', marginBottom: '0.375rem' }}>
                Admin Panel
              </p>
              <h2 style={{ marginBottom: '0.25rem' }}>Provider Management</h2>
              <p style={{ fontSize: '0.875rem' }}>Review and approve service provider background checks</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={fetchProviders} disabled={loading}>
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Providers', value: counts.ALL,     color: '#A78BFA', bg: 'rgba(124,58,237,0.12)' },
            { label: 'Pending Review', value: counts.PENDING,  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
            { label: 'Approved',       value: counts.APPROVED, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
            { label: 'Rejected',       value: counts.REJECTED, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color, borderColor: `${s.color}40` }}>
                <FiUser />
              </div>
              <div className="stat-info">
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '50px' }}
            >
              {s} {counts[s] > 0 && (
                <span style={{ background: filter === s ? 'rgba(255,255,255,0.25)' : 'var(--purple-primary)', color: 'white', borderRadius: '50px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                  {counts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Provider List */}
        {loading ? (
          <LoadingSpinner text="Loading providers..." />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <FiUser size={52} style={{ color: 'rgba(124,58,237,0.2)', margin: '0 auto 1rem', display: 'block' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>No providers</h4>
            <p>No providers match the selected filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((p) => {
              const id     = p.PROVIDER_ID || p.provider_id;
              const first  = p.FIRST_NAME  || p.first_name || '';
              const last   = p.LAST_NAME   || p.last_name  || '';
              const name   = `${first} ${last}`.trim() || 'Provider';
              const uname  = p.USERNAME    || p.username   || '';
              const email  = p.EMAIL       || p.email      || '';
              const status = p.BACKGROUND_CHK || p.background_chk || 'PENDING';
              const badge  = statusBadge(status);

              return (
                <div key={id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(0,245,160,0.2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'var(--accent-mint)', fontSize: '1.1rem',
                    }}>
                      {name[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiUser size={12} /> @{uname}
                        </span>
                        {email && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FiMail size={12} /> {email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <span className={`badge ${badge.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {badge.icon} {badge.label}
                    </span>
                    {status === 'PENDING' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(id, name)}
                        disabled={approving === id}
                      >
                        <FiCheckCircle />
                        {approving === id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && <ErrorModal success title="Provider Approved" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}
