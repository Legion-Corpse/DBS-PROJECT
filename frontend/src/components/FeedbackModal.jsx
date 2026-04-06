import { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import { submitFeedback } from '../api/feedback';
import ErrorModal from './ErrorModal';

export default function FeedbackModal({ onClose }) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (rating === 0) return;
        setSubmitting(true);
        try {
            const res = await submitFeedback({ rating, comments: comments || undefined });
            if (res.success) setSuccess(true);
            else setError(res.error?.message || 'Submission failed');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <ErrorModal
                message="Thank you for your feedback!"
                type="success"
                onClose={onClose}
            />
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rate ServeMart</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><FiX size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                            How would you rate your experience?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FiStar
                                    key={i}
                                    size={32}
                                    fill={(hovered || rating) > i ? '#F59E0B' : 'none'}
                                    color={(hovered || rating) > i ? '#F59E0B' : 'var(--text-muted)'}
                                    style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                                    onMouseEnter={() => setHovered(i + 1)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setRating(i + 1)}
                                />
                            ))}
                        </div>
                        {rating === 0 && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--accent-violet)', marginTop: '0.4rem' }}>
                                Please select a rating
                            </p>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Comments (optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="Tell us what you think…"
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? 'Sending…' : 'Submit'}
                        </button>
                    </div>
                </form>
                {error && <ErrorModal message={error} onClose={() => setError(null)} />}
            </div>
        </div>
    );
}
