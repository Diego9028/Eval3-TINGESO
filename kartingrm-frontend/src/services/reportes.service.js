// src/services/reportes.service.js
import api from '../http-common';

const ingresosVueltas = (inicio, fin) => api.get('/api/reportes/vueltas', { params: { inicio, fin } });
const ingresosPersonas = (inicio, fin) => api.get('/api/reportes/personas', { params: { inicio, fin } });
const ingresosTiempo = (inicio, fin) => api.get('/api/reportes/tiempo', { params: { inicio, fin } });

export default { ingresosVueltas, ingresosPersonas, ingresosTiempo };
