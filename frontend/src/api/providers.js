import api from './axios';

export async function getProviders() {
  const res = await api.get('/api/providers');
  return res.data;
}

export async function getProvider(id) {
  const res = await api.get(`/api/providers/${id}`);
  return res.data;
}

export async function getCategories() {
  const res = await api.get('/api/providers/categories');
  return res.data;
}

export async function getRecommended(area_id) {
  const res = await api.get(`/api/providers/recommend/${area_id}`);
  return res.data;
}
