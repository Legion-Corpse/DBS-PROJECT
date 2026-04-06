import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { FiDollarSign, FiTrendingUp, FiList, FiRefreshCw } from 'react-icons/fi';
import { MdOutlineCategory } from 'react-icons/md';
import { getRevenue } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

const CHART_COLORS = ['#7C3AED','#00F5A0','#60A5FA','#FBBF24','#F87171','#A78BFA','#2DD4BF','#EC4899'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '0.875rem 1rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.82rem' }}>
          {p.name}: <strong>₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  function fetchRevenue() {
    setLoading(true);
    getRevenue()
      .then((res) => {
        if (res.success) setRevenue(res.data);
        else setError(res.error?.message || 'Failed to load revenue');
      })
      .catch(() => setError('Network error — is the backend running?'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { fetchRevenue(); }, []);

  const totalRevenue  = revenue.reduce((s, r) => s + parseFloat(r.TOTAL_PLATFORM_REVENUE || r.total_platform_revenue || 0), 0);
  const totalGross    = revenue.reduce((s, r) => s + parseFloat(r.TOTAL_GROSS_VALUE || r.total_gross_value || 0), 0);
  const totalBookings = revenue.reduce((s, r) => s + parseInt(r.TOTAL_BOOKINGS || r.total_bookings || 0), 0);

  const chartData = revenue.map((r, i) => ({
    name:     r.CATEGORY_NAME || r.category_name || `Cat ${i+1}`,
    revenue:  parseFloat(r.TOTAL_PLATFORM_REVENUE || r.total_platform_revenue || 0),
    gross:    parseFloat(r.TOTAL_GROSS_VALUE || r.total_gross_value || 0),
    bookings: parseInt(r.TOTAL_BOOKINGS || r.total_bookings || 0),
  }));

  const STAT_CARDS = [
    { icon: <FiDollarSign />, value: `₹${totalRevenue.toLocaleString('en-IN',{maximumFractionDigits:0})}`, label: 'Platform Revenue', color: '#00F5A0', bg: 'rgba(0,245,160,0.12)' },
    { icon: <FiTrendingUp />, value: `₹${totalGross.toLocaleString('en-IN',{maximumFractionDigits:0})}`,   label: 'Gross Value',      color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
    { icon: <FiList />,       value: totalBookings,                                                          label: 'Completed Bookings',color: '#A78BFA', bg: 'rgba(124,58,237,0.12)' },
    { icon: <MdOutlineCategory />, value: revenue.length,                                                   label: 'Active Categories', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,160,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-mint)', marginBottom: '0.375rem' }}>
                Admin Panel
              </p>
              <h2 style={{ marginBottom: '0.25rem' }}>Revenue Analytics</h2>
              <p style={{ fontSize: '0.875rem' }}>Platform earnings broken down by service category</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={fetchRevenue} disabled={loading}>
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>

        {/* Stat cards */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="stat-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="stat-icon" style={{ background: s.bg, borderColor: `${s.color}40`, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-info">
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading revenue data..." />
        ) : chartData.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <FiDollarSign size={52} style={{ color: 'rgba(0,245,160,0.2)', margin: '0 auto 1rem', display: 'block' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>No revenue data yet</h4>
            <p>Data appears once bookings are completed and invoices generated.</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="card animate-fade-up" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Platform Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                  <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans', fontSize: '0.82rem' }} />
                  <Bar dataKey="revenue" name="Platform Fee" radius={[6,6,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="gross" name="Gross Value" radius={[6,6,0,0]} fill="rgba(124,58,237,0.2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="card animate-fade-up delay-2">
              <h3 style={{ marginBottom: '1.25rem' }}>Category Breakdown</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Category','Bookings','Platform Revenue','Gross Value','Avg/Booking'].map((h) => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontFamily: 'Syne,sans-serif', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.875rem 1rem', fontFamily: 'Syne,sans-serif', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 8px ${CHART_COLORS[i%CHART_COLORS.length]}88` }} />
                            {row.name}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>{row.bookings}</td>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--accent-mint)', fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>
                          ₹{row.revenue.toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                          ₹{row.gross.toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#A78BFA', fontWeight: 600, fontFamily: 'Syne,sans-serif' }}>
                          ₹{row.bookings > 0 ? (row.gross/row.bookings).toLocaleString('en-IN',{minimumFractionDigits:2}) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
}
