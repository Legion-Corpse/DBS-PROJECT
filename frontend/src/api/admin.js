import api from './axios';

export async function getRevenue() {
  const res = await api.get('/api/admin/revenue');
  return res.data;
}

export async function getErrorLogs() {
  const res = await api.get('/api/admin/error-logs');
  return res.data;
}

export async function getAdminProviders() {
  const res = await api.get('/api/admin/providers');
  return res.data;
}

export async function approveProvider(providerId) {
  const res = await api.post(`/api/admin/providers/${providerId}/approve`);
  return res.data;
}

export async function addServiceArea(cityName, regionCode) {
  const res = await api.post('/api/admin/areas', { cityName, regionCode });
  return res.data;
}
