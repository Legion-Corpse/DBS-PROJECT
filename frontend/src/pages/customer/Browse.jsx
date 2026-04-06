import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiMap, FiGrid } from 'react-icons/fi';
import ProviderCard from '../../components/ProviderCard';
import CategoryGrid from '../../components/CategoryGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapView from '../../components/MapView';
import { getProviders } from '../../api/providers';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);
  const [sortBy, setSortBy]             = useState('rating');
  const [viewMode, setViewMode]         = useState('grid'); // 'grid' | 'map'

  useEffect(() => {
    getProviders()
      .then((res) => { if (res.success) setProviders(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCategory) setSearchParams({ category: selectedCategory });
    else setSearchParams({});
  }, [selectedCategory]);

  const filtered = providers
    .filter((p) => {
      const name = (p.FULL_NAME || p.full_name || '').toLowerCase();
      const cat  = (p.CATEGORY_NAME || p.category_name || '').toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
      const matchCat    = !selectedCategory || cat.toUpperCase().includes(selectedCategory.toUpperCase());
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.RATING_AVG || b.rating_avg || 0) - parseFloat(a.RATING_AVG || a.rating_avg || 0);
      return (b.JOBS_COMPLETED || b.jobs_completed || 0) - (a.JOBS_COMPLETED || a.jobs_completed || 0);
    });

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
              onChange={(e) => setSearch(e.target.value)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            </div>
            <FiFilter style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.875rem', fontSize: '0.82rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="jobs">Most Experienced</option>
            </select>
          </div>
        </div>

        {/* Grid / Map */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {[1,2,3,4].map((i) => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }} />)}
          </div>
        ) : viewMode === 'map' ? (
          <div>
            {(() => {
              const allAreas = [];
              const seen = new Set();
              filtered.forEach(p => {
                const city = p.CITY_NAME || p.city_name;
                if (city && !seen.has(city)) {
                  seen.add(city);
                  allAreas.push({ CITY_NAME: city, REGION_CODE: p.REGION_CODE || p.region_code });
                }
              });
              return allAreas.length > 0
                ? <MapView areas={allAreas} />
                : (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FiMap size={44} style={{ color: 'rgba(124,58,237,0.25)', margin: '0 auto 1rem', display: 'block' }} />
                    <p>No location data available for the current results.</p>
                  </div>
                );
            })()}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {filtered.map((p, i) => (
                <div key={p.PROVIDER_ID || p.provider_id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ProviderCard provider={p} />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {filtered.map((p, i) => (
              <div key={p.PROVIDER_ID || p.provider_id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProviderCard provider={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', border: '1px dashed var(--border-medium)' }}>
            <FiSearch size={44} style={{ color: 'rgba(124,58,237,0.25)', margin: '0 auto 1rem', display: 'block' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>No providers found</h4>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => { setSearch(''); setSelectedCategory(null); }}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
