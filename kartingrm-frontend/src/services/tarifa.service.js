// src/services/tarifa.service.js
import api from '../http-common';

const getAll = () => api.get('/api/tarifas');

const getByVueltas = (vueltas) =>
  api.get(`/api/tarifas/by-vueltas?numeroVueltas=${vueltas}`);

const getDescuentoEspecial = (clienteId, fecha) =>
  api.get(`/api/tarifa-especial/descuento`, {
    params: {
      clienteId,
      fecha
    }
  });

const getDescuentoFrecuencia = (frecuencia) =>
  api.get(`/api/descuento-frecuencia?Frecuencia=${frecuencia}`);

export default {
  getAll,
  getByVueltas,
  getDescuentoEspecial,
  getDescuentoFrecuencia
};
