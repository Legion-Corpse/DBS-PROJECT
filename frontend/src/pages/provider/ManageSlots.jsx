import { useEffect, useState } from 'react';
import { FiClock, FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageSlots() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ day_of_week: '1', slot_start: '09:00', slot_end: '17:00' });
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(null);

  function fetchSlots() {
    setLoading(true);
    api.get('/api/providers/my/slots')
      .then((res) => {
        if (res.data.success) setSlots(res.data.data);
      })
      .catch(() => {
        // Slots endpoint may not be implemented yet — show placeholder
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchSlots(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (form.slot_start >= form.slot_end) {
      setError('Start time must be before end time');
      return;
    }
    setAdding(true);
    try {
      const res = await api.post('/api/providers/my/slots', {
        day_of_week: Number(form.day_of_week),
        slot_start: form.slot_start,
        slot_end: form.slot_end,
      });
      if (res.data.success) {
        setSuccess('Slot added successfully!');
        fetchSlots();
        setForm({ day_of_week: '1', slot_start: '09:00', slot_end: '17:00' });
      } else {
        setError(res.data.error?.message || 'Failed to add slot');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add slot. This feature may not be available yet.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/providers/my/slots/${id}`);
      fetchSlots();
    } catch (err) {
      setError('Failed to delete slot');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '2rem 1.5rem' }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Manage Availability</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            Set your working hours and available time slots
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Current Slots */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Your Availability Slots</h3>
            {loading ? (
              <LoadingSpinner text="Loading slots..." />
            ) : slots.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FiCalendar size={48} style={{ color: 'var(--purple-light)', marginBottom: '1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No slots configured</h4>
                <p>Add your first availability slot using the form</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {slots.map((slot) => {
                  const id = slot.AVAILABILITY_ID || slot.availability_id;
                  const start = slot.SLOT_START || slot.slot_start;
                  const end = slot.SLOT_END || slot.slot_end;
                  const available = slot.IS_AVAILABLE || slot.is_available;
                  const dayFromDb = slot.DAY_OF_WEEK || slot.day_of_week;
                  
                  const dayMap = { 'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6 };
                  const dayIdx = typeof dayFromDb === 'string' ? dayMap[dayFromDb.toUpperCase()] : dayFromDb;
                  const dayLabel = DAYS[dayIdx] || dayFromDb;

                  return (
                    <div key={id} className="card" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderLeft: `4px solid ${available ? 'var(--success)' : 'var(--danger)'}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{dayLabel}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiClock /> {start} – {end}
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 600, color: available ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {available ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      {available ? (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#FEE2E2', color: 'var(--danger)', borderRadius: '8px', padding: '0.375rem' }}
                          onClick={() => handleDelete(id)}
                          title="Remove slot"
                        >
                          <FiTrash2 />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Slot Form */}
          <div className="card">
            <h4 style={{ marginBottom: '1rem' }}><FiPlus style={{ marginRight: '0.375rem' }} />Add New Slot</h4>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select
                  className="form-select"
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.slot_start}
                    onChange={(e) => setForm({ ...form, slot_start: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.slot_end}
                    onChange={(e) => setForm({ ...form, slot_end: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={adding}>
                {adding ? 'Adding...' : <><FiPlus /> Add Slot</>}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--purple-light)', borderRadius: 'var(--border-radius-sm)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--purple-dark)', fontWeight: 500 }}>
                Tip: Customers can only book slots marked as Available. Slots become unavailable once booked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && <ErrorModal success title="Done!" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}
