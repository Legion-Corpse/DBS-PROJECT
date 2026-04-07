import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiTag, FiMapPin, FiArrowLeft, FiCheckCircle, FiGift, FiAlertTriangle } from 'react-icons/fi';
import { getProvider } from '../../api/providers';
import { createBooking } from '../../api/bookings';
import api from '../../api/axios';
import StarRating from '../../components/StarRating';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorModal from '../../components/ErrorModal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookingForm() {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    serviceId: '',
    houseNo: '',
    buildingName: '',
    areaLandmark: '',
    city: '',
    postalCode: '',
    availabilityId: '',
    promoCode: '',
    scheduledDate: '',
    durationHours: 3,
  });
  const [errors, setErrors] = useState({});
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [intervalOptions, setIntervalOptions] = useState([]);
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Success
  const [bookedSlots, setBookedSlots] = useState([]); // {booking_date, start_hour, end_hour}
  const [promoStatus, setPromoStatus] = useState(null); // null | { discountPercentage, maxDiscountAmt } | 'error'
  const [promoMsg, setPromoMsg] = useState('');

  // Helper to find the next few dates for a given day name (e.g., 'MONDAY')
  function getNextDates(dayName, count = 4) {
    if (!dayName) return [];
    const dayMap = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
    const targetDay = dayMap[dayName.toUpperCase()];
    const dates = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30 && dates.length < count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      if (d.getDay() === targetDay) {
        dates.push(new Date(d));
      }
    }
    return dates;
  }

  function handleSlotChange(slotId) {
    const { availability } = providerData;
    const slot = availability.find(s => (s.AVAILABILITY_ID || s.availability_id).toString() === slotId);
    setForm({ ...form, availabilityId: slotId, scheduledDate: '' });
    setSelectedDateStr('');
    setIntervalOptions([]);
    setSelectedInterval(null);
    if (slot) {
      const dates = getNextDates(slot.DAY_OF_WEEK || slot.day_of_week);
      setDateOptions(dates);
    } else {
      setDateOptions([]);
    }
  }

  async function handleDateSelect(dateObj) {
    const slotId = form.availabilityId;
    const { availability } = providerData;
    const slot = availability.find(s => (s.AVAILABILITY_ID || s.availability_id).toString() === slotId);
    if (!slot) return;

    setSelectedDateStr(dateObj.toDateString());
    setSelectedInterval(null);

    // Fetch booked slots for this provider on this date
    // Use local date parts — toISOString() converts to UTC which shifts the date in IST
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    let fetchedBooked = [];
    try {
      const res = await api.get(`/api/bookings/booked-slots/${providerId}`);
      if (res.data.success) {
        fetchedBooked = res.data.data.filter(bs => bs.BOOKING_DATE === dateStr);
        setBookedSlots(fetchedBooked);
      }
    } catch (e) {
      // Non-critical: if fetch fails, allow all slots and let backend validate
      console.warn('Could not fetch booked slots:', e);
    }
    
    // Slice range into 3-hour intervals
    const startStr = slot.SLOT_START || slot.slot_start;
    const endStr = slot.SLOT_END || slot.slot_end;
    const [startH] = startStr.split(':').map(Number);
    const [endH] = endStr.split(':').map(Number);
    
    const slices = [];
    for (let h = startH; h + 3 <= endH; h += 3) {
      const isBooked = fetchedBooked.some(bs => {
        const bStart = Number(bs.START_HOUR);
        const bEnd = Number(bs.END_HOUR);
        return h < bEnd && (h + 3) > bStart;
      });
      if (!isBooked) {
        slices.push({
          start: h, end: h + 3,
          label: `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'} - ${(h + 3) % 12 || 12}:00 ${h + 3 >= 12 ? 'PM' : 'AM'}`,
        });
      }
    }
    setIntervalOptions(slices);
    setErrors({ ...errors, scheduledDate: null });
  }

  function handleIntervalSelect(slice, dateObjStr) {
    const dateObj = new Date(dateObjStr);
    const combined = new Date(dateObj);
    combined.setHours(slice.start, 0, 0, 0);
    
    setForm({ ...form, scheduledDate: combined.toISOString(), durationHours: 3 });
    setSelectedInterval(slice);
    setErrors({ ...errors, scheduledDate: null });
  }

  useEffect(() => {
    getProvider(providerId)
      .then((res) => {
        if (res.success) setProviderData(res.data);
        else setError(res.error?.message || 'Provider not found');
      })
      .catch(() => setError('Failed to load provider details'))
      .finally(() => setLoading(false));
  }, [providerId]);

  function validate() {
    const e = {};
    if (!form.serviceId) e.serviceId = 'Please select a service';
    if (!form.houseNo) e.houseNo = 'House/Flat No required';
    if (!form.areaLandmark) e.areaLandmark = 'Area/Landmark required';
    if (!form.city) e.city = 'City required';
    if (!form.postalCode) e.postalCode = 'Pincode required';
    if (!form.availabilityId) e.availabilityId = 'Please select availability';
    if (!form.scheduledDate) e.scheduledDate = 'Please pick a date/time';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        serviceId: Number(form.serviceId),
        houseNo: form.houseNo,
        buildingName: form.buildingName,
        areaLandmark: form.areaLandmark,
        city: form.city,
        postalCode: form.postalCode ? Number(form.postalCode) : undefined,
        availabilityId: Number(form.availabilityId),
        promoCode: form.promoCode || null,
        scheduledDate: form.scheduledDate,
        durationHours: 3,
      };
      const res = await createBooking(payload);
      if (res.success) {
        setStep(2);
      } else {
        setError(res.error?.message || 'Booking failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckPromo() {
    const code = form.promoCode.trim();
    if (!code) return;
    setPromoStatus(null);
    setPromoMsg('');
    try {
      const res = await api.get(`/api/bookings/validate-promo?code=${encodeURIComponent(code)}`);
      if (res.data.success) {
        setPromoStatus(res.data.data);
        const { discountPercentage, maxDiscountAmt } = res.data.data;
        setPromoMsg(`${discountPercentage}% off (up to ₹${maxDiscountAmt})`);
      }
    } catch (err) {
      setPromoStatus('error');
      setPromoMsg(err.response?.data?.error?.message || 'Invalid promo code');
    }
  }

  if (loading) return <LoadingSpinner text="Loading provider details..." />;

  if (!providerData) return (
    <div className="container" style={{ padding: '3rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Provider Details Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'The provider you are looking for does not exist or could not be loaded.'}
        </p>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--border-medium)' }} onClick={() => navigate(-1)}>
          <FiArrowLeft style={{ marginRight: '0.5rem' }} /> Go Back
        </button>
      </div>
    </div>
  );

  const { provider, availability, areas, services } = providerData;
  const name = provider?.FULL_NAME || provider?.full_name || 'Provider';
  const category = provider?.CATEGORY_NAME || provider?.category_name || '';
  const rating = parseFloat(provider?.RATING_AVG || provider?.rating_avg || 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', padding: '0 0 3rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple-primary), var(--purple-dark))', padding: '1.5rem' }}>
        <div className="container">
          <button
            className="btn btn-ghost btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '1rem' }}
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft /> Back
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>Book a Service</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                {step === 1 && 'Select your preferred time and address'}
                {step === 2 && 'All set! Your booking is confirmed'}
              </p>
            </div>
            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: step >= s ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s'
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: step < 2 ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Booking Details</h3>
              <form onSubmit={handleSubmit} noValidate>
                {/* Service Selection */}
                <div className="form-group">
                  <label className="form-label">Service</label>
                  <select
                    className={`form-select${errors.serviceId ? ' error' : ''}`}
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  >
                    <option value="">— Choose a service —</option>
                    {services.map((svc) => (
                      <option key={svc.SERVICE_ID || svc.service_id} value={svc.SERVICE_ID || svc.service_id}>
                        {svc.SERVICE_NAME || svc.service_name} • ₹{svc.HOURLY_RATE || svc.hourly_rate}/hr
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && <span className="form-error">{errors.serviceId}</span>}
                </div>

                {/* Address Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Service Address</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <input
                        type="text"
                        className={`form-input${errors.houseNo ? ' error' : ''}`}
                        placeholder="Flat/House No"
                        value={form.houseNo}
                        onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
                      />
                      {errors.houseNo && <span className="form-error">{errors.houseNo}</span>}
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Building (Optional)"
                      value={form.buildingName}
                      onChange={(e) => setForm({ ...form, buildingName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className={`form-input${errors.areaLandmark ? ' error' : ''}`}
                      placeholder="Area / Landmark"
                      value={form.areaLandmark}
                      onChange={(e) => setForm({ ...form, areaLandmark: e.target.value })}
                    />
                    {errors.areaLandmark && <span className="form-error">{errors.areaLandmark}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <input
                        type="text"
                        className={`form-input${errors.city ? ' error' : ''}`}
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                      {errors.city && <span className="form-error">{errors.city}</span>}
                      {(() => {
                        if (!form.city || !areas || areas.length === 0) return null;
                        const covered = areas.some(a =>
                          (a.CITY_NAME || a.city_name || '').toLowerCase() === form.city.trim().toLowerCase()
                        );
                        if (covered) return null;
                        return (
                          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: '#F59E0B', fontSize: '0.78rem' }}>
                            <FiAlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>
                              This provider primarily serves: {areas.map(a => a.CITY_NAME || a.city_name).join(', ')}. Your city may be outside their normal coverage.
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <input
                        type="number"
                        className={`form-input${errors.postalCode ? ' error' : ''}`}
                        placeholder="Pincode"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      />
                      {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
                    </div>
                  </div>
                </div>

                {/* Availability Slot (Range) */}
                <div className="form-group">
                  <label className="form-label"><FiClock style={{ marginRight: '0.375rem' }} />Availability Range</label>
                  <select
                    className={`form-select${errors.availabilityId ? ' error' : ''}`}
                    value={form.availabilityId}
                    onChange={(e) => handleSlotChange(e.target.value)}
                  >
                    <option value="">— Choose availability day —</option>
                    {availability.map((slot) => (
                      <option key={slot.AVAILABILITY_ID || slot.availability_id} value={slot.AVAILABILITY_ID || slot.availability_id}>
                        {slot.DAY_OF_WEEK || slot.day_of_week} &nbsp;
                        ({slot.SLOT_START || slot.slot_start} – {slot.SLOT_END || slot.slot_end})
                      </option>
                    ))}
                  </select>
                  {errors.availabilityId && <span className="form-error">{errors.availabilityId}</span>}
                </div>

                {/* Date Selection */}
                {dateOptions.length > 0 && (
                  <div className="form-group">
                    <label className="form-label"><FiCalendar style={{ marginRight: '0.375rem' }} />Pick a Date</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {dateOptions.map((date, idx) => (
                        <button
                          key={idx} type="button"
                          onClick={() => handleDateSelect(date)}
                          style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            border: selectedDateStr === date.toDateString() ? '2px solid var(--purple-primary)' : '1px solid var(--border-subtle)',
                            background: selectedDateStr === date.toDateString() ? 'var(--purple-light)' : 'var(--bg-card)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{date.toLocaleDateString(undefined, { month: 'short' })}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{date.getDate()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No slots available for selected date */}
                {intervalOptions.length === 0 && selectedDateStr && (
                  <div className="form-group">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      No available slots on this date. Please pick another date.
                    </p>
                  </div>
                )}

                {/* 3-Hour Interval Selection */}
                {intervalOptions.length > 0 && selectedDateStr && (
                  <div className="form-group">
                    <label className="form-label"><FiClock style={{ marginRight: '0.375rem' }} />Pick a 3-Hour Slot</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {intervalOptions.map((slice, idx) => (
                        <button
                          key={idx} type="button"
                          onClick={() => handleIntervalSelect(slice, selectedDateStr)}
                          style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            border: selectedInterval === slice
                              ? '2px solid var(--purple-primary)'
                              : '1px solid var(--border-subtle)',
                            background: selectedInterval === slice
                              ? 'var(--purple-light)'
                              : 'var(--bg-card)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          {slice.label}
                        </button>
                      ))}
                    </div>
                    {errors.scheduledDate && <span className="form-error">{errors.scheduledDate}</span>}
                  </div>
                )}

                {/* Promo Code */}
                <div className="form-group">
                  <label className="form-label"><FiTag style={{ marginRight: '0.375rem' }} />Promo Code <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter promo code for a discount"
                      value={form.promoCode}
                      onChange={(e) => {
                        setForm({ ...form, promoCode: e.target.value.toUpperCase() });
                        setPromoStatus(null);
                        setPromoMsg('');
                      }}
                      style={{ textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleCheckPromo}
                      disabled={!form.promoCode.trim()}
                      style={{ flexShrink: 0 }}
                    >
                      <FiGift /> Check
                    </button>
                  </div>
                  {promoMsg && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: promoStatus === 'error' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {promoStatus === 'error' ? <FiAlertTriangle size={13} /> : <FiCheckCircle size={13} />}
                      {promoMsg}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
                  {submitting ? 'Creating Booking...' : 'Confirm Booking'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Success */}
          {step === 2 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
                color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem', fontSize: '2.5rem'
              }}>
                <FiCheckCircle />
              </div>
              <h2>Booking Confirmed!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Your booking is now <strong>pending</strong> and the provider has been notified.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                Payment will be collected after the service is completed. An invoice will be generated at that time.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/customer/bookings')}>
                Go to My Bookings
              </button>
            </div>
          )}

          {/* Sidebar (Only in Step 1) */}
          {step < 2 && (
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Provider Details</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--purple-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <span className="provider-category-badge">{category}</span>
                  </div>
                </div>
              </div>
              <div className="card" style={{ background: 'rgba(124,58,237,0.05)', border: '1px dashed var(--purple-primary)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 3-hour minimum duration for all bookings to ensure quality service.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
}
