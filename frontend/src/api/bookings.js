import api from './axios';

export async function createBooking(data) {
  const res = await api.post('/api/bookings/create', data);
  return res.data;
}

export async function getMyBookings() {
  const res = await api.get('/api/bookings/my');
  return res.data;
}

export async function completeBooking(id, paymentMethod = 'CASH') {
  const res = await api.post(`/api/bookings/complete/${id}`, { paymentMethod });
  return res.data;
}

export async function cancelBooking(id, reason) {
  const res = await api.post(`/api/bookings/cancel/${id}`, { reason });
  return res.data;
}

export async function submitReview(bookingId, data) {
  const res = await api.post(`/api/reviews/${bookingId}`, data);
  return res.data;
}
