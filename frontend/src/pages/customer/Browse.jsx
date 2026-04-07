import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiMap, FiGrid, FiStar, FiMapPin } from 'react-icons/fi';
import ProviderCard from '../../components/ProviderCard';
import CategoryGrid from '../../components/CategoryGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapView from '../../components/MapView';
import { getProviders, getAreas, getRecommended } from '../../api/providers';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders]         = useState([]);
  const [areas, setAreas]                 = useState([]);
  const [recommended, setRecommended]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [recLoading, setRecLoading]       = useState(false);
  const [search, setSearch]               = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);
  const [selectedAreaId, setSelectedAreaId]     = useState('');
  const [sortBy, setSortBy]               = useState('rating');
  const [viewMode, setViewMode]           = useState('grid'); // 'grid' | 'map' | 'recommended'

  useEffect(() => {
    Promise.all([getProviders(), getAreas()])
      .then(([provRes, areaRes]) => {
        if (provRes.success) setProviders(provRes.data);
        if (areaRes.success) setAreas(areaRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCategory) setSearchParams({ category: selectedCategory });
    else setSearchParams({});
  }, [selectedCategory]);

  useEffect(() => {
    if (viewMode !== 'recommended' || !selectedAreaId) return;
    setRecLoading(true);
    getRecommended(selectedAreaId)
      .then(res => { if (res.success) setRecommended(res.data); })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [viewMode, selectedAreaId]);

  const filtered = providers
    .filter(p => {
      const name  = (p.FULL_NAME || '').toLowerCase();
      const cat   = (p.CATEGORY_NAME || '').toLowerCase();
      const cities = (p.CITIES || '').toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase()) || cities.includes(search.toLowerCase());
      const matchCat    = !selectedCategory || cat.toUpperCase().includes(selectedCategory.toUpperCase());
      const matchArea   = !selectedAreaId || (() => {
        const area = areas.find(a => String(a.AREA_ID) === String(selectedAreaId));
        return area && cities.includes(area.CITY_NAME.toLowerCase());
      })();
      return matchSearch && matchCat && matchArea;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.RATING_AVG || 0) - parseFloat(a.RATING_AVG || 0);
      return (b.JOBS_COMPLETED || 0) - (a.JOBS_COMPLETED || 0);
    });

  // Build map areas from filtered provider CITIES strings
  const mapAreas = (() => {
    const seen = new Set();
    const result = [];
    filtered.forEach(p => {
      const cities = (p.CITIES || '').split(',').map(c => c.trim()).filter(Boolean);
      cities.forEach(city => {
        if (!seen.has(city)) {
          seen.add(city);
          const areaObj = areas.find(a => a.CITY_NAME === city);
          result.push({ CITY_NAME: city, REGION_CODE: areaObj?.REGION_CODE || '' });
        }
      });
    });
    return result;
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', pointerEvents: 'none', animation: 'float-a 11s ease-in-out infinite' }} />
        <div className="container">
          <p style={{ fontSize: '0.7rem', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-mint)', marginBottom: '0.5rem' }}>
            Find a Professional
          </p>
          <h2 style={{ marginBottom: '1.25rem' }}>Browse Providers</h2>
          <div className="search-bar" style={{ maxWidth: '520px' }}>
            <FiSearch style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search by name, category, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>

        {/* Categories */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Filter by Category
          </h4>
          <CategoryGrid selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* Controls bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {loading ? '...' : (
              <>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{filtered.length}</span>
                {' '}provider{filtered.length !== 1 ? 's' : ''}
                {selectedCategory && <> in <span style={{ color: 'var(--accent-mint)' }}>{selectedCategory}</span></>}
              </>
            )}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

            {/* Area filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiMapPin size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.875rem', fontSize: '0.82rem' }}
                value={selectedAreaId}
                onChange={e => setSelectedAreaId(e.target.value)}
              >
                <option value="">All Cities</option>
                {areas.map(a => (
                  <option key={a.AREA_ID} value={a.AREA_ID}>{a.CITY_NAME}</option>
                ))}
              </select>
            </div>

            {/* View mode toggle */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.375rem 0.75rem' }}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FiGrid />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.375rem 0.75rem' }}
                onClick={() => setViewMode('map')}
                title="Map View"
              >
                <FiMap />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'recommended' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem', display: 'flex', alignItems: 'center' }}
                onClick={() => setViewMode('recommended')}
                title="Recommended for Area"
              >
                <FiStar size={13} /> Recommended
              </button>
            </div>

            <FiFilter style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.875rem', fontSize: '0.82rem' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="jobs">Most Experienced</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }} />)}
          </div>

        ) : viewMode === 'recommended' ? (
          <div>
            {!selectedAreaId ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FiMapPin size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>Select a city to see recommendations</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Use the city filter above to get providers ranked by rating and experience for your area.
                </p>
              </div>
            ) : recLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }} />)}
              </div>
            ) : recommended.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FiStar size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No approved providers in this area yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try a different city or browse all providers.</p>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Ranked by rating (50%) + experience (30%) + baseline (20%)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recommended.map((p, i) => (
                    <div key={p.PROVIDER_ID} className="card animate-fade-up" style={{
                      padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      animationDelay: `${i * 0.05}s`
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#B45309' : 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem',
                        color: i < 3 ? '#000' : 'var(--text-muted)'
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{p.FULL_NAME}</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {p.RATING_AVG} ★ · {p.JOBS_COMPLETED} jobs
                        </p>
                      </div>
                      <div style={{
                        background: 'rgba(124,58,237,0.15)',
                        color: 'var(--accent-violet)',
                        borderRadius: 99,
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>
                        Score: {p.SCORE}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : viewMode === 'map' ? (
          <div>
            {mapAreas.length > 0
              ? <MapView areas={mapAreas} />
              : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <FiMap size={44} style={{ color: 'rgba(124,58,237,0.25)', margin: '0 auto 1rem', display: 'block' }} />
                  <p>No providers with location data in the current filter.</p>
                </div>
              )
            }
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {filtered.map((p, i) => (
                <div key={p.PROVIDER_ID || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ProviderCard provider={p} />
                </div>
              ))}
            </div>
          </div>

        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {filtered.map((p, i) => (
              <div key={p.PROVIDER_ID || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProviderCard provider={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', border: '1px dashed var(--border-medium)' }}>
            <FiSearch size={44} style={{ color: 'rgba(124,58,237,0.25)', margin: '0 auto 1rem', display: 'block' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>No providers found</h4>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => { setSearch(''); setSelectedCategory(null); setSelectedAreaId(''); }}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
