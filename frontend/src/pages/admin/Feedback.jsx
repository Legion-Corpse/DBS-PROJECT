import { useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { getAdminFeedback } from '../../api/feedback';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

export default function AdminFeedback() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminFeedback()
            .then(res => { if (res.success) setData(res.data); })
            .catch(() => setError('Failed to load feedback'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    const stats = data?.stats;
    const feedback = data?.feedback || [];

    return (
        <div className="page-container" style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Platform Feedback</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>User satisfaction ratings for ServeMart</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card">
                        <p className="stat-label">Average Rating</p>
                        <p className="stat-value">{stats.AVG_RATING ?? '—'} / 5</p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-label">Total Responses</p>
                        <p className="stat-value">{stats.TOTAL_RESPONSES ?? 0}</p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-label">Positive (4–5 ★)</p>
                        <p className="stat-value">{stats.POSITIVE_COUNT ?? 0}</p>
                    </div>
                </div>
            )}

            {feedback.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FiStar size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No feedback submitted yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {feedback.map(f => (
                        <div key={f.FEEDBACK_ID} className="card" style={{ padding: '1.1rem 1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.4rem' }}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <FiStar
                                                key={i}
                                                size={14}
                                                fill={i < f.RATING ? '#F59E0B' : 'none'}
                                                color={i < f.RATING ? '#F59E0B' : 'var(--text-muted)'}
                                            />
                                        ))}
                                    </div>
                                    {f.COMMENTS && (
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                            {f.COMMENTS}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {f.USERNAME} · {f.USER_ROLE}
                                    </p>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {new Date(f.SUBMITTED_AT).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
        </div>
    );
}
