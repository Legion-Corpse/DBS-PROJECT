import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClock, FiRefreshCw, FiMapPin, FiUser } from 'react-icons/fi';
import { MdOutlineBookmarkBorder } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';
import { getMyBookings, completeBooking } from '../../api/bookings';

function statusBadge(status) {
  const map = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('CONFIRMED');

  const fetchBookings = useCallback(() => {
    setLoading(true);
    getMyBookings()
      .then((res) => {
        if (res.success) setBookings(res.data);
        else setError(res.error?.message || 'Failed to load bookings');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  async function handleComplete(bookingId) {
    setCompleting(bookingId);
    try {
      const res = await completeBooking(bookingId);
      if (res.success) {
        setSuccess('Job marked as complete! Invoice has been generated.');
        fetchBookings();
      } else {
        setError(res.error?.message || 'Failed to complete booking');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to complete booking');
    } finally {
      setCompleting(null);
    }
  }

  const counts = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].reduce((acc, s) => {
    acc[s] = bookings.filter((b) => (b.STATUS || b.status) === s).length;
    return acc;
  }, {});

  const filtered = filter === 'ALL'
    ? bookings
    : bookings.filter((b) => (b.STATUS || b.status) === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '2rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Provider Dashboard</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                Welcome back, {user?.username}
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              onClick={fetchBookings}
              disabled={loading}
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon"><FiClock /></div>
            <div className="stat-info">
              <h3>{counts.PENDING || 0}</h3>
              <p>Pending Jobs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}><FiCalendar /></div>
            <div className="stat-info">
              <h3>{counts.CONFIRMED || 0}</h3>
              <p>Confirmed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#D1FAE5', color: 'var(--success)' }}><FiCheckCircle /></div>
            <div className="stat-info">
              <h3>{counts.COMPLETED || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/provider/slots')}>
            <FiCalendar /> Manage Slots
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'ALL'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <h3 style={{ marginBottom: '1rem' }}>
          {filter === 'ALL' ? 'All Bookings' : `${filter} Bookings`}
          {!loading && ` (${filtered.length})`}
        </h3>

        {loading ? (
          <LoadingSpinner text="Loading bookings..." />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <MdOutlineBookmarkBorder size={52} style={{ color: 'var(--purple-light)', marginBottom: '1rem' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>No {filter.toLowerCase()} bookings</h4>
            <p>New bookings will appear here automatically</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((b, i) => {
              const id = b.BOOKING_ID || b.booking_id;
              const serviceName = b.SERVICE_NAME || b.service_name || 'Service';
              const location = b.LOCATION || b.location || '';
              const date = b.SCHEDULED_DATE || b.scheduled_date;
              const slotStart = b.SLOT_START || b.slot_start;
              const slotEnd = b.SLOT_END || b.slot_end;
              const status = b.STATUS || b.status || 'PENDING';
              const total = b.NET_TOTAL || b.net_total;

              return (
                <div key={id || i} className={`booking-card status-${status.toLowerCase()}`}>
                  <div className="booking-card-header">
                    <div>
                      <div className="booking-card-title">{serviceName}</div>
                      <div className="booking-card-meta">
                        <span className="booking-card-meta-item"><FiUser /> Booking #{id}</span>
                        {location && <span className="booking-card-meta-item"><FiMapPin /> {location}</span>}
                        {date && (
                          <span className="booking-card-meta-item">
                            <FiCalendar /> {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {slotStart && slotEnd && (
                          <span className="booking-card-meta-item">
                            <FiClock /> {slotStart} &ndash; {slotEnd}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${statusBadge(status)}`}>{status}</span>
                  </div>
                  <div className="booking-card-footer">
                    <div>
                      {total != null ? (
                        <div className="booking-total">₹{parseFloat(total).toFixed(2)}</div>
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Invoice pending</div>
                      )}
                    </div>
                    <div className="booking-actions">
                      {(status === 'PENDING' || status === 'CONFIRMED') && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleComplete(id)}
                          disabled={completing === id}
                        >
                          <FiCheckCircle />
                          {completing === id ? 'Completing...' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && <ErrorModal success title="Job Completed!" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}
