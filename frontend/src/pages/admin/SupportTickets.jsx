import { useEffect, useState } from 'react';
import { FiInbox } from 'react-icons/fi';
import { getAdminTickets, updateTicketStatus } from '../../api/support';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

const STATUS_COLORS = {
    OPEN: '#F59E0B',
    IN_PROGRESS: '#3B82F6',
    RESOLVED: '#10B981',
    CLOSED: '#6B7280',
};

const NEXT_STATUS = {
    OPEN: 'IN_PROGRESS',
    IN_PROGRESS: 'RESOLVED',
    RESOLVED: 'CLOSED',
};

export default function SupportTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState(null);

    function fetchTickets() {
        setLoading(true);
        getAdminTickets()
            .then(res => { if (res.success) setTickets(res.data); })
            .catch(() => setError('Failed to load tickets'))
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchTickets(); }, []);

    async function handleAdvance(ticketId, currentStatus) {
        const next = NEXT_STATUS[currentStatus];
        if (!next) return;
        setUpdating(ticketId);
        try {
            await updateTicketStatus(ticketId, next);
            setTickets(prev => prev.map(t =>
                t.TICKET_ID === ticketId ? { ...t, STATUS: next } : t
            ));
        } catch {
            setError('Failed to update ticket status');
        } finally {
            setUpdating(null);
        }
    }

    const filters = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const visible = filter === 'ALL' ? tickets : tickets.filter(t => t.STATUS === filter);

    const counts = filters.slice(1).reduce((acc, s) => {
        acc[s] = tickets.filter(t => t.STATUS === s).length;
        return acc;
    }, {});

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container" style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Support Tickets</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {tickets.length} total · {counts['OPEN'] || 0} open
                </p>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                    >
                        {f.replace('_', ' ')}
                        {f !== 'ALL' && counts[f] > 0 && (
                            <span style={{
                                marginLeft: '0.4rem',
                                background: STATUS_COLORS[f] + '33',
                                color: STATUS_COLORS[f],
                                borderRadius: 99,
                                padding: '0 0.4rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>{counts[f]}</span>
                        )}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FiInbox size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No tickets in this category.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {visible.map(t => (
                        <div key={t.TICKET_ID} className="card" style={{
                            padding: '1.25rem',
                            borderLeft: `3px solid ${STATUS_COLORS[t.STATUS]}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                                        <p style={{ fontWeight: 600 }}>{t.SUBJECT}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            #{t.TICKET_ID}
                                        </span>
                                    </div>
                                    {t.DESCRIPTION && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                                            {t.DESCRIPTION}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span>{t.USERNAME} ({t.USER_ROLE})</span>
                                        <span>{new Date(t.CREATED_AT).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        {t.BOOKING_ID && <span>Booking #{t.BOOKING_ID}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: 99,
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        background: STATUS_COLORS[t.STATUS] + '22',
                                        color: STATUS_COLORS[t.STATUS]
                                    }}>
                                        {t.STATUS.replace('_', ' ')}
                                    </span>
                                    {NEXT_STATUS[t.STATUS] && (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleAdvance(t.TICKET_ID, t.STATUS)}
                                            disabled={updating === t.TICKET_ID}
                                            style={{ fontSize: '0.78rem' }}
                                        >
                                            {updating === t.TICKET_ID ? '…' : `Mark ${NEXT_STATUS[t.STATUS].replace('_', ' ')}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
        </div>
    );
}
