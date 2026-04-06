import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { completeBooking } from '../../api/bookings';
import ErrorModal from '../../components/ErrorModal';

export default function JobComplete() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await completeBooking(bookingId);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error?.message || 'Failed to mark job as complete');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to complete job');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-light)', padding: '2rem',
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: '#D1FAE5', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', margin: '0 auto 1.5rem',
          }}>
            <FiCheckCircle />
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>Mark Job Complete</h2>
          <p style={{ marginBottom: '0.5rem' }}>Booking ID: <strong>#{bookingId}</strong></p>
          <p style={{ marginBottom: '2rem' }}>
            Confirm that the service has been delivered to the customer. An invoice will be generated automatically.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/provider/dashboard')}
            >
              <FiArrowLeft /> Back
            </button>
            <button
              className="btn btn-success"
              onClick={handleComplete}
              disabled={completing}
            >
              <FiCheckCircle />
              {completing ? 'Processing...' : 'Confirm Completion'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && (
        <ErrorModal
          success
          title="Job Completed!"
          message="The booking has been marked as complete and the invoice has been generated. Well done!"
          onClose={() => navigate('/provider/dashboard')}
        />
      )}
    </div>
  );
}
