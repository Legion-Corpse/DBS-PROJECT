import { FiCalendar, FiMapPin, FiUser, FiFileText, FiClock } from 'react-icons/fi';
import { MdOutlineCancel } from 'react-icons/md';
import { FiStar } from 'react-icons/fi';

function statusBadge(status) {
  const map = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
}

export default function BookingCard({ booking, onCancel, onReview, onViewInvoice }) {
  const {
    BOOKING_ID, booking_id,
    SERVICE_NAME, service_name,
    PROVIDER, provider,
    LOCATION, location,
    SCHEDULED_DATE, scheduled_date,
    SLOT_START, slot_start,
    SLOT_END, slot_end,
    STATUS, status,
    NET_TOTAL, net_total,
    PAYMENT_STATUS, payment_status,
    CANCELLATION_REASON, cancellation_reason,
  } = booking;

  const id = BOOKING_ID || booking_id;
  const svcName = SERVICE_NAME || service_name || 'Service';
  const providerName = PROVIDER || provider || 'Provider';
  const loc = LOCATION || location || '';
  const date = SCHEDULED_DATE || scheduled_date;
  const slotStart = SLOT_START || slot_start;
  const slotEnd = SLOT_END || slot_end;
  const st = STATUS || status || 'PENDING';
  const total = NET_TOTAL || net_total;
  const payStatus = PAYMENT_STATUS || payment_status;
  const cancelReason = CANCELLATION_REASON || cancellation_reason;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    : 'Date TBD';

  return (
    <div className={`booking-card status-${st.toLowerCase()}`}>
      <div className="booking-card-header">
        <div>
          <div className="booking-card-title">{svcName}</div>
          <div className="booking-card-meta">
            <span className="booking-card-meta-item"><FiUser /> {providerName}</span>
            {loc && <span className="booking-card-meta-item"><FiMapPin /> {loc}</span>}
            <span className="booking-card-meta-item"><FiCalendar /> {formattedDate}</span>
            {slotStart && slotEnd && (
              <span className="booking-card-meta-item"><FiClock /> {slotStart} – {slotEnd}</span>
            )}
          </div>
        </div>
        <span className={`badge ${statusBadge(st)}`}>{st}</span>
      </div>

      {cancelReason && st === 'CANCELLED' && (
        <div style={{ padding: '0.5rem 0.75rem', margin: '0 0 0.5rem', background: '#FEF2F2', borderRadius: '6px', fontSize: '0.8rem', color: '#B91C1C' }}>
          <strong>Cancellation reason:</strong> {cancelReason}
        </div>
      )}

      <div className="booking-card-footer">
        <div>
          {total != null ? (
            <div className="booking-total">
              ₹{parseFloat(total).toFixed(2)}
              {payStatus && <span> · {payStatus}</span>}
            </div>
          ) : st === 'CANCELLED' ? null : (
            <div className="booking-total" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              Invoice pending
            </div>
          )}
        </div>

        <div className="booking-actions">
          {total != null && onViewInvoice && (
            <button className="btn btn-ghost btn-sm" onClick={() => onViewInvoice(id)}>
              <FiFileText /> Invoice
            </button>
          )}
          {(st === 'PENDING' || st === 'CONFIRMED') && onCancel && (
            <button
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => onCancel(id)}
            >
              <MdOutlineCancel /> Cancel
            </button>
          )}
          {st === 'COMPLETED' && onReview && (
            <button className="btn btn-ghost btn-sm" onClick={() => onReview(id)}>
              <FiStar /> Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
