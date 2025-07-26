// src/services/rack.service.js
import api from '../http-common';

const getBySemana = (anio, semana) => api.get('/api/rack-semanal', {
  params: { anio, semana }
});

export default { getBySemana };
