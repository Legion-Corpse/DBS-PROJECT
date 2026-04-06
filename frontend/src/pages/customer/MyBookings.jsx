import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import { MdOutlineBookmarkBorder } from 'react-icons/md';
import BookingCard from '../../components/BookingCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';
import InvoiceModal from '../../components/InvoiceModal';
import { getMyBookings, cancelBooking } from '../../api/bookings';
import { getInvoice } from '../../api/invoices';

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    getMyBookings()
      .then((res) => {
        if (res.success) setBookings(res.data);
        else setError(res.error?.message || 'Failed to load bookings');
      })
      .catch(() => setError('Network error. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBookings();
    // Poll every 30s
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await cancelBooking(cancelModal, cancelReason);
      if (res.success) {
        setCancelModal(null);
        setCancelReason('');
        fetchBookings();
      } else {
        setError(res.error?.message || 'Cancellation failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  }

  async function handleViewInvoice(id) {
    setLoadingInvoice(true);
    try {
      const res = await getInvoice(id);
      if (res.success) {
        setInvoiceModal(res.data);
      } else {
        setError(res.error?.message || 'Failed to load invoice');
      }
    } catch (err) {
      setError('Technical error fetching invoice');
    } finally {
      setLoadingInvoice(false);
    }
  }

  const statusFilters = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

  const filtered = filter === 'ALL'
    ? bookings
    : bookings.filter((b) => (b.STATUS || b.status) === filter);

  const counts = statusFilters.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? bookings.length : bookings.filter((b) => (b.STATUS || b.status) === s).length;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '2rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>My Bookings</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Track all your service appointments</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchBookings} disabled={loading}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '50px' }}
            >
              {s} {counts[s] > 0 && <span style={{
                background: filter === s ? 'rgba(255,255,255,0.25)' : 'var(--purple-primary)',
                color: filter === s ? 'white' : 'white',
                borderRadius: '50px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.25rem',
              }}>{counts[s]}</span>}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <LoadingSpinner text="Loading your bookings..." />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <MdOutlineBookmarkBorder size={52} style={{ color: 'var(--purple-light)', marginBottom: '1rem' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>
              {filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
            </h4>
            <p style={{ marginBottom: '1.5rem' }}>
              {filter === 'ALL' ? 'Start by browsing service providers near you' : 'Try a different filter'}
            </p>
            {filter === 'ALL' && (
              <button className="btn btn-primary" onClick={() => navigate('/customer/browse')}>
                Browse Providers
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((b, i) => (
              <BookingCard
                key={b.BOOKING_ID || b.booking_id || i}
                booking={b}
                onCancel={(id) => { setCancelModal(id); setCancelReason(''); }}
                onReview={(id) => navigate(`/customer/review/${id}`)}
                onViewInvoice={handleViewInvoice}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ marginBottom: '0.5rem' }}>Cancel Booking</h3>
            <p style={{ marginBottom: '1rem' }}>Please provide a reason for cancellation:</p>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g., Change of plans, Rescheduling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ resize: 'vertical', marginBottom: '1rem' }}
            />
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                Keep Booking
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceModal && (
        <InvoiceModal
          invoice={invoiceModal}
          onClose={() => setInvoiceModal(null)}
        />
      )}
      {loadingInvoice && <div className="modal-overlay"><LoadingSpinner text="Fetching Invoice..." /></div>}
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
}
