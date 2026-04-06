import api from './axios';

export const submitFeedback = (data) => api.post('/feedback', data).then(r => r.data);
export const getAdminFeedback = () => api.get('/feedback/admin').then(r => r.data);
