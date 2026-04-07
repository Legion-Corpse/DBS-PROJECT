import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiCalendar, FiCheckCircle, FiGrid, FiArrowRight, FiZap, FiMapPin, FiStar } from 'react-icons/fi';
import { FaWrench, FaBolt, FaBroom, FaHardHat } from 'react-icons/fa';
import { MdOutlineHomeRepairService } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import ProviderCard from '../../components/ProviderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getProviders, getAreas, getRecommended } from '../../api/providers';
import { getMyBookings } from '../../api/bookings';
import api from '../../api/axios';

const QUICK_CATS = [
  { name: 'Plumbing',     icon: <FaWrench />, accent: '#60A5FA' },
  { name: 'Electrical',   icon: <FaBolt />,   accent: '#FBBF24' },
  { name: 'Cleaning',     icon: <FaBroom />,  accent: '#34D399' },
  { name: 'Construction', icon: <FaHardHat />,accent: '#F87171' },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [providers, setProviders]         = useState([]);
  const [bookings, setBookings]           = useState([]);
  const [recommended, setRecommended]     = useState([]);
  const [detectedCity, setDetectedCity]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');

  useEffect(() => {
    Promise.all([getProviders(), getMyBookings(), getAreas()])
      .then(async ([pRes, bRes, areaRes]) => {
        if (pRes.success) setProviders(pRes.data);
        if (bRes.success) setBookings(bRes.data);

        // Detect customer's city from most recent booking address and load recommendations
        try {
          const cityRes = await api.get('/api/bookings/my-city');
          const city = cityRes.data?.data?.city;
          if (city && areaRes.success) {
            const match = areaRes.data.find(a => a.CITY_NAME.toLowerCase() === city.toLowerCase());
            if (match) {
              setDetectedCity(match.CITY_NAME);
              const recRes = await getRecommended(match.AREA_ID);
              if (recRes.success) setRecommended(recRes.data);
            }
          }
        } catch {
          // No bookings yet or city not in SERVICE_AREAS — recommendations stay empty
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? providers.filter((p) => {
        const name = (p.FULL_NAME || p.full_name || '').toLowerCase();
        const cat  = (p.CATEGORY_NAME || p.category_name || '').toLowerCase();
        return name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
      })
    : providers.slice(0, 8);

  const upcomingCount  = bookings.filter((b) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.STATUS || b.status)).length;
  const completedCount = bookings.filter((b) => (b.STATUS || b.status) === 'COMPLETED').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header hero strip */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '2.5rem 1.5rem 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* bg orb */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'float-a 10s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div className="container">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
            Good day
          </p>
          <h2 style={{ marginBottom: '1.5rem' }}>
            Hello, <span style={{ background: 'linear-gradient(135deg,#A78BFA,#00F5A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.username}</span>
          </h2>
          <div className="search-bar" style={{ maxWidth: '520px' }}>
            <FiSearch style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search providers by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-2rem', paddingBottom: '3rem' }}>

        {/* Stats cards */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { icon: <FiCalendar />, value: upcomingCount, label: 'Upcoming Bookings', color: '#A78BFA', bg: 'rgba(124,58,237,0.15)' },
            { icon: <FiCheckCircle />, value: completedCount, label: 'Completed Jobs', color: '#34D399', bg: 'rgba(16,185,129,0.15)' },
            { icon: <FiGrid />, value: providers.length, label: 'Available Providers', color: '#60A5FA', bg: 'rgba(59,130,246,0.15)' },
          ].map((s, i) => (
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

        {/* Quick categories */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Browse by Category</h3>
            <Link to="/customer/browse" style={{ fontSize: '0.8rem', color: 'var(--accent-mint)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              All categories <FiArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {QUICK_CATS.map((cat, i) => (
              <Link
                key={cat.name}
                to={`/customer/browse?category=${cat.name.toUpperCase()}`}
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.125rem 0.75rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  textDecoration: 'none', transition: 'all 0.22s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.accent;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${cat.accent}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '11px',
                  background: `${cat.accent}18`, color: cat.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                }}>
                  {cat.icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Location-aware recommendations */}
        {recommended.length > 0 && !search && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiMapPin size={16} style={{ color: 'var(--accent-mint)' }} />
                <h3>Recommended near {detectedCity}</h3>
              </div>
              <Link to={`/customer/browse`} style={{ fontSize: '0.8rem', color: 'var(--accent-mint)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                See all <FiArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recommended.slice(0, 5).map((p, i) => (
                <div key={p.PROVIDER_ID} className="card animate-fade-up" style={{
                  padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  animationDelay: `${i * 0.05}s`
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#F59E0B33' : 'var(--bg-card)',
                    border: i === 0 ? '1px solid #F59E0B66' : '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.82rem', color: i === 0 ? '#F59E0B' : 'var(--text-muted)'
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.FULL_NAME}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FiStar size={11} style={{ color: '#F59E0B' }} />
                      {p.RATING_AVG} · {p.JOBS_COMPLETED} jobs · Score: {p.SCORE}
                    </p>
                  </div>
                  <Link to={`/customer/book/${p.PROVIDER_ID}`} className="btn btn-primary btn-sm">
                    Book
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Providers grid */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3>{search ? `Results for "${search}"` : 'Available Providers'}</h3>
            <Link to="/customer/browse" style={{ fontSize: '0.8rem', color: 'var(--accent-mint)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Browse All <FiArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
              {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
              {filtered.map((p, i) => (
                <div key={p.PROVIDER_ID || p.provider_id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <ProviderCard provider={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <MdOutlineHomeRepairService size={44} style={{ color: 'rgba(124,58,237,0.25)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>
                {search ? `No providers matching "${search}"` : 'No providers yet. Be the first to join!'}
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
