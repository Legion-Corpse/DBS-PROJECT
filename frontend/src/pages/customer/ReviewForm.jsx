import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { submitReview } from '../../api/bookings';
import ErrorModal from '../../components/ErrorModal';

export default function ReviewForm() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e = {};
    if (!rating) e.rating = 'Please select a star rating';
    if (!comment.trim() || comment.length < 10) e.comment = 'Comment must be at least 10 characters';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await submitReview(bookingId, { rating, comment });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error?.message || 'Failed to submit review');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '1.5rem' }}>
        <div className="container">
          <button
            className="btn btn-ghost btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '1rem' }}
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft /> Back
          </button>
          <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Leave a Review</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            Booking #{bookingId} — Share your experience
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '560px' }}>
        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            {/* Star Rating */}
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem' }}>
                How would you rate this service?
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '2.5rem', padding: '0.25rem',
                      color: star <= (hover || rating) ? '#F59E0B' : '#D1D5DB',
                      transition: 'transform 0.1s, color 0.1s',
                      transform: star <= (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
              {(hover || rating) > 0 && (
                <div style={{ fontWeight: 600, color: 'var(--purple-primary)', fontSize: '0.95rem' }}>
                  {labels[hover || rating]}
                </div>
              )}
              {errors.rating && <span className="form-error" style={{ display: 'block', marginTop: '0.5rem' }}>{errors.rating}</span>}
            </div>

            <div className="divider" />

            {/* Comment */}
            <div className="form-group">
              <label className="form-label"><FiMessageSquare style={{ marginRight: '0.375rem' }} />Your Review</label>
              <textarea
                className={`form-input${errors.comment ? ' error' : ''}`}
                rows={5}
                placeholder="Describe your experience with the provider. Was the work done well? Were they punctual? Would you recommend them?"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (errors.comment) setErrors({ ...errors, comment: null });
                }}
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  {errors.comment ? (
                    <span className="form-error" style={{ margin: 0 }}>{errors.comment}</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Minimum 10 characters required
                    </span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  color: comment.length < 10 ? 'var(--danger)' : 'var(--success)' 
                }}>
                  {comment.length}/500
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Submitting...</>
              ) : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && (
        <ErrorModal
          success
          title="Review Submitted!"
          message="Thank you for your feedback! Your review helps other customers make better decisions."
          onClose={() => navigate('/customer/bookings')}
        />
      )}
    </div>
  );
}
