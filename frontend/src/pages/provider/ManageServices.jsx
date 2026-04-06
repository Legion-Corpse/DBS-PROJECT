import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiTag, FiDollarSign, FiBriefcase } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';
import api from '../../api/axios';
import { getCategories } from '../../api/providers';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    category_id: '',
    service_name: '',
    hourly_rate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/api/providers/my/services'),
        getCategories()
      ]);
      if (svcRes.data.success) setServices(svcRes.data.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      setError('Failed to load your services');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.category_id || !form.service_name || !form.hourly_rate) {
      setError('Please fill all fields');
      return;
    }
    setAdding(true);
    try {
      const res = await api.post('/api/providers/my/services', {
        category_id: Number(form.category_id),
        service_name: form.service_name,
        hourly_rate: Number(form.hourly_rate)
      });
      if (res.data.success) {
        setSuccess('Service added successfully!');
        setForm({ category_id: '', service_name: '', hourly_rate: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add service');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to remove this service?')) return;
    try {
      await api.delete(`/api/providers/my/services/${id}`);
      fetchData();
    } catch (err) {
      setError('Failed to remove service');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Manage Your Services</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            List the professional services you offer to customers
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Service List */}
          <div>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBriefcase style={{ color: 'var(--purple-primary)' }} /> Offered Services
            </h3>
            
            {loading ? (
              <LoadingSpinner text="Loading services..." />
            ) : services.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', background: 'var(--purple-light)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  color: 'var(--purple-primary)'
                }}>
                  <FiBriefcase size={32} />
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>No services listed</h4>
                <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                  You haven't added any services yet. Use the form to list your first professional offering.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {services.map((svc) => (
                  <div key={svc.SERVICE_ID || svc.service_id} className="card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span className="provider-category-badge" style={{ margin: 0 }}>
                        {svc.CATEGORY_NAME || svc.category_name}
                      </span>
                      <button 
                        onClick={() => handleDelete(svc.SERVICE_ID || svc.service_id)}
                        style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px' }}
                        title="Remove service"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <h4 style={{ marginBottom: '0.25rem' }}>{svc.SERVICE_NAME || svc.service_name}</h4>
                    <div style={{ 
                      fontSize: '1.25rem', fontWeight: 700, color: 'var(--purple-primary)', 
                      display: 'flex', alignItems: 'center', gap: '0.25rem' 
                    }}>
                      ₹{svc.HOURLY_RATE || svc.hourly_rate} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/hr</span>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, 
                        color: svc.IS_ACTIVE || svc.is_active ? 'var(--success)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                        {svc.IS_ACTIVE || svc.is_active ? 'Active & Listable' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Form */}
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <FiPlus /> Add New Service
            </h4>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.CATEGORY_ID || cat.category_id} value={cat.CATEGORY_ID || cat.category_id}>
                      {cat.CATEGORY_NAME || cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Name</label>
                <div style={{ position: 'relative' }}>
                  <FiTag style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. Pipe Leak Repair"
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hourly Rate (₹)</label>
                <div style={{ position: 'relative' }}>
                  <FiDollarSign style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Price per hour"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                disabled={adding}
              >
                {adding ? <span className="spinner spinner-sm" /> : <><FiPlus /> List Service</>}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(124,58,237,0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--purple-light)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--purple-dark)', fontWeight: 500, lineHeight: 1.5 }}>
                <b>Pro Tip:</b> Specific service names like "Ceiling Fan Installation" get 3x more clicks than generic ones like "Electrician".
              </p>
            </div>
          </div>

        </div>
      </div>

      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {success && <ErrorModal success title="Service Added" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}
