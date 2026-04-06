import api from './axios';

export async function getInvoice(bookingId) {
  const res = await api.get(`/api/invoices/${bookingId}`);
  return res.data;
}

export async function payInvoice(bookingId, paymentMethod) {
  const res = await api.post(`/api/invoices/${bookingId}/pay`, { paymentMethod });
  return res.data;
}
