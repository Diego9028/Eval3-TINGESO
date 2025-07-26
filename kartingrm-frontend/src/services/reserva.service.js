// src/services/reserva.service.js
import api from '../http-common';

const create     = data => api.post('/api/reservas/crear', data);
const getAll     = ()   => api.get ('/api/reservas');
const getById    = id  => api.get (`/api/reservas/${id}`);
const getWeek    = iso => api.get ('/api/reservas/semana', { params:{ inicio: iso }});
const update     = (id, data) => api.patch(`/api/reservas/${id}`, data);
const remove     = id  => api.delete(`/api/reservas/${id}`);

const getFrecuenciaMensual = (clienteId, fecha) =>
  api.get('/api/reservas/frecuencia-mensual', {
    params: {
      clienteId,
      fecha
    }
  });

export default {
  create,
  getAll,
  getById,
  getWeek,
  update,
  remove,
  getFrecuenciaMensual // 👈 No olvides exportarlo
};
