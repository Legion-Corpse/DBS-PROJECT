import api from './axios';

export const createTicket = (data) => api.post('/support', data).then(r => r.data);
export const getMyTickets = () => api.get('/support/my').then(r => r.data);
export const getAdminTickets = () => api.get('/support/admin').then(r => r.data);
export const updateTicketStatus = (id, status) =>
    api.patch(`/support/${id}/status`, { status }).then(r => r.data);
