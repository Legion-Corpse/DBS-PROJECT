import { useEffect, useState, useCallback } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiSearch, FiClock } from 'react-icons/fi';
import { getErrorLogs } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

export default function ErrorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    getErrorLogs()
      .then((res) => {
        if (res.success) setLogs(res.data);
        else setError(res.error?.message || 'Failed to load error logs');
      })
      .catch(() => setError('Error logs endpoint may not be implemented yet. Backend route needed: GET /api/admin/error-logs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = search
    ? logs.filter((l) => {
        const msg = (l.ERROR_MESSAGE || l.error_message || '').toLowerCase();
        const src = (l.ERROR_SOURCE || l.error_source || '').toLowerCase();
        const q = search.toLowerCase();
        return msg.includes(q) || src.includes(q);
      })
    : logs;

  function severityColor(sev) {
    if (!sev) return 'var(--text-muted)';
    const s = sev.toUpperCase();
    if (s === 'CRITICAL') return '#7C3AED';
    if (s === 'HIGH') return 'var(--danger)';
    if (s === 'MEDIUM') return 'var(--warning)';
    return 'var(--text-muted)';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '2rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Error Logs</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                System error monitoring — {logs.length} log entries
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              onClick={fetchLogs}
              disabled={loading}
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
          <FiSearch style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search error messages or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingSpinner text="Loading error logs..." />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <FiAlertTriangle size={52} style={{ color: 'var(--purple-light)', marginBottom: '1rem' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>
              {search ? 'No matching logs' : 'No error logs'}
            </h4>
            <p>
              {search
                ? 'Try a different search term'
                : 'No errors recorded yet — the system is running smoothly!'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((log, i) => {
              const id = log.LOG_ID || log.log_id || i;
              const msg = log.ERROR_MESSAGE || log.error_message || 'Unknown error';
              const src = log.ERROR_SOURCE || log.error_source || 'Unknown';
              const sev = log.SEVERITY || log.severity || 'LOW';
              const ts = log.LOGGED_AT || log.logged_at;
              const ctx = log.CONTEXT_INFO || log.context_info || '';

              return (
                <div
                  key={id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${severityColor(sev)}`,
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSelected(selected === id ? null : id)}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: severityColor(sev),
                          background: `${severityColor(sev)}18`, borderRadius: '4px',
                          padding: '0.15rem 0.5rem',
                        }}>
                          {sev}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--purple-primary)', fontWeight: 600 }}>
                          {src}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiClock />
                          {ts ? new Date(ts).toLocaleString('en-IN') : 'Unknown time'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-dark)', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: selected === id ? 'normal' : 'nowrap' }}>
                        {msg}
                      </p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>#{id}</span>
                  </div>

                  {selected === id && ctx && (
                    <div style={{
                      marginTop: '1rem', padding: '0.875rem', background: '#F9FAFB',
                      borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem',
                      fontFamily: 'monospace', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {ctx}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
}
