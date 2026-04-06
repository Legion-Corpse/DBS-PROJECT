import { useEffect, useState } from 'react';
import { FiPlus, FiX, FiMessageSquare } from 'react-icons/fi';
import { getMyTickets, createTicket } from '../../api/support';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

const STATUS_COLORS = {
    OPEN: '#F59E0B',
    IN_PROGRESS: '#3B82F6',
    RESOLVED: '#10B981',
    CLOSED: '#6B7280',
};

export default function Support() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ subject: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

    function fetchTickets() {
        setLoading(true);
        getMyTickets()
            .then(res => { if (res.success) setTickets(res.data); })
            .catch(() => setError('Failed to load tickets'))
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchTickets(); }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject.trim()) return;
        setSubmitting(true);
        try {
            const res = await createTicket({
                subject: form.subject,
                description: form.description || undefined
            });
            if (res.success) {
                setModal(false);
                setForm({ subject: '', description: '' });
                setFeedback('Ticket submitted successfully');
                fetchTickets();
            } else {
                setError(res.error?.message || 'Failed to submit ticket');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Support Tickets</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                    <FiPlus size={15} /> New Ticket
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FiMessageSquare size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No support tickets yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tickets.map(t => (
                        <div key={t.TICKET_ID} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{t.SUBJECT}</p>
                                    {t.DESCRIPTION && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                                            {t.DESCRIPTION}
                                        </p>
                                    )}
                                    {t.SERVICE_NAME && (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            Linked to: {t.SERVICE_NAME}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                        {new Date(t.CREATED_AT).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 99,
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    background: STATUS_COLORS[t.STATUS] + '22',
                                    color: STATUS_COLORS[t.STATUS],
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}>
                                    {t.STATUS.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Ticket Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>New Support Ticket</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input
                                    className="form-input"
                                    placeholder="Briefly describe your issue"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    maxLength={200}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Provide more details (optional)"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                    maxLength={2000}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting…' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {feedback && <ErrorModal message={feedback} type="success" onClose={() => setFeedback(null)} />}
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
        </div>
    );
}
