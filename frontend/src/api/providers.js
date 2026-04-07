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

export async function getAreas() {
  const res = await api.get('/api/providers/areas');
  return res.data;
}

export async function getMyAreas() {
  const res = await api.get('/api/providers/my/areas');
  return res.data;
}

export async function addMyArea(areaId) {
  const res = await api.post('/api/providers/my/areas', { areaId });
  return res.data;
}

export async function removeMyArea(areaId) {
  const res = await api.delete(`/api/providers/my/areas/${areaId}`);
  return res.data;
}
