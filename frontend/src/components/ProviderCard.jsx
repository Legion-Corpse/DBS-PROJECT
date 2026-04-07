import { useNavigate } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import StarRating from './StarRating';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7C3AED,#00F5A0)',
  'linear-gradient(135deg,#3B82F6,#00F5A0)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#10B981,#3B82F6)',
  'linear-gradient(135deg,#EC4899,#7C3AED)',
  'linear-gradient(135deg,#06B6D4,#10B981)',
  'linear-gradient(135deg,#8B5CF6,#3B82F6)',
  'linear-gradient(135deg,#F59E0B,#10B981)',
];

function getGradient(name = '') {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
}

export default function ProviderCard({ provider, onBook, showBookBtn = true }) {
  const navigate = useNavigate();
  const {
    PROVIDER_ID, provider_id,
    FULL_NAME,    full_name,
    CATEGORY_NAME, category_name,
    RATING_AVG,   rating_avg,
    JOBS_COMPLETED, jobs_completed,
    HOURLY_RATE,  hourly_rate,
  } = provider;

  const id       = PROVIDER_ID || provider_id;
  const name     = FULL_NAME || full_name || 'Provider';
  const category = CATEGORY_NAME || category_name || 'Service';
  const rating   = parseFloat(RATING_AVG || rating_avg || 0);
  const jobs     = JOBS_COMPLETED || jobs_completed || 0;
  const rate     = HOURLY_RATE || hourly_rate;
  const cities   = (provider.CITIES || provider.cities || '').split(',').map(c => c.trim()).filter(Boolean);

  function handleBook() {
    if (onBook) return onBook(provider);
    navigate(`/customer/book/${id}`);
  }

  return (
    <div className="provider-card">
      <div className="provider-card-header">
        <div
          className="provider-avatar"
          style={{ background: getGradient(name) }}
        >
          {getInitials(name)}
        </div>
        <div className="provider-info">
          <h4>{name}</h4>
          <span className="provider-category-badge">{category}</span>
        </div>
      </div>

      <div>
        <StarRating rating={rating} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {jobs > 0 ? `${jobs} jobs completed` : 'New provider'}
        </p>
        {cities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <FiMapPin size={11} style={{ color: 'var(--accent-mint)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {cities.slice(0, 3).join(' · ')}{cities.length > 3 ? ` +${cities.length - 3}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="provider-card-stats">
        <div>
          {rate ? (
            <div className="provider-rate">₹{rate}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/hr</span></div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Contact for rates</div>
          )}
        </div>
        {showBookBtn && (
          <button className="btn btn-primary btn-sm" onClick={handleBook}>
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}
