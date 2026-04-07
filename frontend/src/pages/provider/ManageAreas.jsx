import { useEffect, useState } from 'react';
import { FiMapPin, FiPlus, FiX } from 'react-icons/fi';
import { getAreas, getMyAreas, addMyArea, removeMyArea } from '../../api/providers';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

export default function ManageAreas() {
    const [allAreas, setAllAreas] = useState([]);
    const [myAreas, setMyAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(null);
    const [removing, setRemoving] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    async function fetchAll() {
        setLoading(true);
        try {
            const [allRes, myRes] = await Promise.all([getAreas(), getMyAreas()]);
            if (allRes.success) setAllAreas(allRes.data);
            if (myRes.success) setMyAreas(myRes.data);
        } catch {
            setError('Failed to load areas');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchAll(); }, []);

    async function handleAdd(areaId, cityName) {
        setAdding(areaId);
        try {
            const res = await addMyArea(areaId);
            if (res.success) {
                setSuccess(`Now serving ${cityName}`);
                await fetchAll();
            } else {
                setError(res.error?.message || 'Failed to add area');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to add area');
        } finally {
            setAdding(null);
        }
    }

    async function handleRemove(areaId, cityName) {
        setRemoving(areaId);
        try {
            const res = await removeMyArea(areaId);
            if (res.success) {
                setSuccess(`Removed ${cityName}`);
                await fetchAll();
            } else {
                setError(res.error?.message || 'Failed to remove area');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to remove area');
        } finally {
            setRemoving(null);
        }
    }

    const myAreaIds = new Set(myAreas.map(a => a.AREA_ID));
    const available = allAreas.filter(a => !myAreaIds.has(a.AREA_ID));

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container" style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Service Areas</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Select which cities you are available to work in. Customers filter and discover providers by area.
                </p>
            </div>

            {/* Currently serving */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-mint)', marginBottom: '0.875rem' }}>
                    Currently Serving ({myAreas.length})
                </h3>
                {myAreas.length === 0 ? (
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-medium)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            You haven't added any service areas yet. Add cities below to appear in customer searches.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {myAreas.map(a => (
                            <div key={a.AREA_ID} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.3)',
                                borderRadius: 99, padding: '0.35rem 0.9rem',
                                fontSize: '0.875rem', fontWeight: 500
                            }}>
                                <FiMapPin size={12} style={{ color: 'var(--accent-mint)' }} />
                                <span>{a.CITY_NAME}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>· {a.REGION_CODE}</span>
                                <button
                                    onClick={() => handleRemove(a.AREA_ID, a.CITY_NAME)}
                                    disabled={removing === a.AREA_ID}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                                        padding: '0 0 0 0.25rem', marginLeft: '0.1rem'
                                    }}
                                    title="Remove area"
                                >
                                    <FiX size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add areas */}
            <div>
                <h3 style={{ fontSize: '0.85rem', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
                    Add Areas ({available.length} available)
                </h3>
                {available.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        You're serving all available areas.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {available.map(a => (
                            <div key={a.AREA_ID} className="card" style={{
                                padding: '0.875rem 1.25rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <FiMapPin size={15} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontWeight: 500 }}>{a.CITY_NAME}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.REGION_CODE}</span>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleAdd(a.AREA_ID, a.CITY_NAME)}
                                    disabled={adding === a.AREA_ID}
                                >
                                    <FiPlus size={13} />
                                    {adding === a.AREA_ID ? 'Adding…' : 'Add'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
            {success && <ErrorModal message={success} type="success" onClose={() => setSuccess(null)} />}
        </div>
    );
}
