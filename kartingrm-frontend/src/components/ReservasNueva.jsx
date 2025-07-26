import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  Box, TextField, Button, MenuItem, Typography, Alert, LinearProgress, 
  Stepper, Step, StepLabel, Card, CardContent, Divider, InputAdornment
} from "@mui/material";
import 'dayjs/locale/es';

import tarifaService from "../services/tarifa.service";
import reservaService from "../services/reserva.service";
import clienteService from "../services/cliente.service";

export default function ReservasNueva() {
  const navigate = useNavigate();
  const [tarifas, setTarifas] = useState([]);
  const [reservaId, setReservaId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [emailValidationStates, setEmailValidationStates] = useState({});
  const [emailValidationTimeouts, setEmailValidationTimeouts] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Información del Titular', 'Participantes', 'Detalles de Reserva', 'Confirmación'];

  const [form, setForm] = useState({
    correoTitular: "",
    fechaHoraReserva: dayjs().add(1, 'hour').startOf('hour'),
    tarifaId: "",
  });

  const [correosParticipantes, setCorreosParticipantes] = useState([""]);
  const [fechaNacimientoTitular, setFechaNacimientoTitular] = useState(null);
  const [clienteTitularId, setClienteTitularId] = useState(null);
  const [descuentoFrecuencia, setDescuentoFrecuencia] = useState(0);

  useEffect(() => {
    // Configurar dayjs en español
    dayjs.locale('es');
    
    const cargarTarifas = async () => {
      try {
        const response = await tarifaService.getAll();
        setTarifas(response.data);
        if (response.data.length > 0) {
          setActiveStep(1); // Avanzar cuando se cargan las tarifas
        }
      } catch (err) {
        setError("Error al cargar las tarifas disponibles. Por favor, recarga la página.");
      }
    };
    cargarTarifas();

    // Cleanup function para limpiar timeouts
    return () => {
      Object.values(emailValidationTimeouts).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    };
  }, [emailValidationTimeouts]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateEmailExists = useCallback(async (email, fieldKey) => {
    if (!validateEmail(email)) {
      setEmailValidationStates(prev => ({
        ...prev,
        [fieldKey]: { status: 'invalid', message: 'Formato de email inválido' }
      }));
      
      // Limpiar datos del titular si es el email del titular
      if (fieldKey === 'correoTitular') {
        setFechaNacimientoTitular(null);
        setClienteTitularId(null);
        setDescuentoFrecuencia(0);
      }
      
      return false;
    }

    try {
      setEmailValidationStates(prev => ({
        ...prev,
        [fieldKey]: { status: 'checking', message: 'Verificando email...' }
      }));

      const response = await clienteService.buscarPorEmail(email);
      
      if (response && response.email) {
        setEmailValidationStates(prev => ({
          ...prev,
          [fieldKey]: { status: 'valid', message: 'Email existe en el sistema' }
        }));
        
        // Si es el titular, obtener fecha de nacimiento
        if (fieldKey === 'correoTitular' && response.id) {
          const fechaNacimiento = await clienteService.obtenerFechaNacimiento(response.id);
          setFechaNacimientoTitular(fechaNacimiento);
          setClienteTitularId(response.id);
        }
        
        return true;
      } else {
        setEmailValidationStates(prev => ({
          ...prev,
          [fieldKey]: { status: 'notFound', message: 'Este email no está registrado en el sistema' }
        }));
        
        // Limpiar datos del titular si es el email del titular
        if (fieldKey === 'correoTitular') {
          setFechaNacimientoTitular(null);
          setClienteTitularId(null);
          setDescuentoFrecuencia(0);
        }
        
        return false;
      }
    } catch (err) {
      setEmailValidationStates(prev => ({
        ...prev,
        [fieldKey]: { status: 'notFound', message: 'Este email no está registrado en el sistema' }
      }));
      
      // Limpiar datos del titular si es el email del titular
      if (fieldKey === 'correoTitular') {
        setFechaNacimientoTitular(null);
        setClienteTitularId(null);
        setDescuentoFrecuencia(0);
      }
      
      return false;
    }
  }, []);

  // Función con debounce para validación en tiempo real
  const debouncedValidateEmail = useCallback((email, fieldKey, delay = 500) => {
    // Limpiar timeout anterior si existe
    if (emailValidationTimeouts[fieldKey]) {
      clearTimeout(emailValidationTimeouts[fieldKey]);
    }

    if (!email.trim()) {
      setEmailValidationStates(prev => ({
        ...prev,
        [fieldKey]: { status: 'empty', message: '' }
      }));
      
      // Limpiar datos del titular si es el email del titular
      if (fieldKey === 'correoTitular') {
        setFechaNacimientoTitular(null);
        setClienteTitularId(null);
        setDescuentoFrecuencia(0);
      }
      
      return;
    }

    // Crear nuevo timeout
    const timeoutId = setTimeout(() => {
      validateEmailExists(email, fieldKey);
    }, delay);

    setEmailValidationTimeouts(prev => ({
      ...prev,
      [fieldKey]: timeoutId
    }));
  }, [emailValidationTimeouts, validateEmailExists]);

  // Función para obtener el ícono de estado de validación
  const getValidationIcon = () => {
    return null;
  };

  // Función para obtener el color del helper text
  const getHelperTextColor = (fieldKey) => {
    const state = emailValidationStates[fieldKey];
    if (!state) return undefined;
    
    switch (state.status) {
      case 'valid':
        return '#4caf50';
      case 'notFound':
      case 'invalid':
        return '#f44336';
      case 'checking':
        return '#ff9800';
      default:
        return undefined;
    }
  };

  const esFeriado = (fecha) => {
    // Lista de feriados chilenos para 2025
    const feriados2025 = [
      '2025-01-01', // Año Nuevo
      '2025-03-28', // Viernes Santo
      '2025-03-29', // Sábado Santo
      '2025-05-01', // Día del Trabajador
      '2025-05-21', // Día de las Glorias Navales
      '2025-06-29', // San Pedro y San Pablo
      '2025-07-16', // Virgen del Carmen
      '2025-08-15', // Asunción de la Virgen
      '2025-09-18', // Independencia Nacional
      '2025-09-19', // Día de las Glorias del Ejército
      '2025-10-12', // Encuentro de Dos Mundos
      '2025-10-31', // Día de las Iglesias Evangélicas
      '2025-11-01', // Día de Todos los Santos
      '2025-12-08', // Inmaculada Concepción
      '2025-12-25', // Navidad
    ];
    
    const fechaStr = fecha.format('YYYY-MM-DD');
    return feriados2025.includes(fechaStr);
  };

  const validarHorarioReserva = (fechaHora) => {
    const diaSemana = fechaHora.day(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const hora = fechaHora.hour();
    const esFeriadoNacional = esFeriado(fechaHora);

    // Lunes a viernes (1-5) y no es feriado: 14:00 a 22:00
    if (diaSemana >= 1 && diaSemana <= 5 && !esFeriadoNacional) {
      return hora >= 14 && hora < 22;
    }
    
    // Sábados, domingos o feriados: 10:00 a 22:00
    if (diaSemana === 0 || diaSemana === 6 || esFeriadoNacional) {
      return hora >= 10 && hora < 22;
    }

    return false;
  };

  const obtenerHorarioPermitido = (fechaHora) => {
    const diaSemana = fechaHora.day();
    const esFeriadoNacional = esFeriado(fechaHora);

    if (diaSemana >= 1 && diaSemana <= 5 && !esFeriadoNacional) {
      return "14:00 - 22:00";
    } else {
      return "10:00 - 22:00";
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.correoTitular) {
      errors.correoTitular = "El correo del titular es obligatorio";
    } else if (!validateEmail(form.correoTitular)) {
      errors.correoTitular = "Formato de correo inválido";
    } else if (emailValidationStates.correoTitular?.status === 'notFound') {
      errors.correoTitular = "Este correo no está registrado en el sistema";
    } else if (emailValidationStates.correoTitular?.status === 'checking') {
      errors.correoTitular = "Verificando correo, por favor espera...";
    }

    if (!form.tarifaId) {
      errors.tarifaId = "Debes seleccionar una tarifa";
    }

    if (form.fechaHoraReserva.isBefore(dayjs())) {
      errors.fechaHoraReserva = "La fecha debe ser posterior a la actual";
    } else if (!validarHorarioReserva(form.fechaHoraReserva)) {
      const horarioPermitido = obtenerHorarioPermitido(form.fechaHoraReserva);
      const diaSemana = form.fechaHoraReserva.format('dddd');
      const esFeriadoNacional = esFeriado(form.fechaHoraReserva);
      const tipoHorario = esFeriadoNacional ? "(feriado)" : "";
      errors.fechaHoraReserva = `Horario no válido para ${diaSemana} ${tipoHorario}. Horario permitido: ${horarioPermitido}`;
    }

    // Validar participantes
    const emailsValidos = correosParticipantes.filter(email => email.trim() !== "");
    if (emailsValidos.length === 0) {
      errors.participantes = "Debe haber al menos un participante";
    }

    // Verificar correos duplicados en participantes
    const emailsUnicos = new Set();
    const emailsDuplicados = new Set();
    
    emailsValidos.forEach((email) => {
      const emailLower = email.toLowerCase().trim();
      if (emailsUnicos.has(emailLower)) {
        emailsDuplicados.add(emailLower);
      } else {
        emailsUnicos.add(emailLower);
      }
    });

    emailsValidos.forEach((email) => {
      const fieldKey = `participante_${emailsValidos.indexOf(email)}`;
      const emailLower = email.toLowerCase().trim();
      
      if (!validateEmail(email)) {
        errors[fieldKey] = `Email ${emailsValidos.indexOf(email) + 1} tiene formato inválido`;
      } else if (emailsDuplicados.has(emailLower)) {
        errors[fieldKey] = `Este email está duplicado`;
      } else if (emailValidationStates[fieldKey]?.status === 'notFound') {
        errors[fieldKey] = `Este email no está registrado en el sistema`;
      } else if (emailValidationStates[fieldKey]?.status === 'checking') {
        errors[fieldKey] = `Verificando email ${emailsValidos.indexOf(email) + 1}, por favor espera...`;
      }
    });

    return errors;
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
    if (error) setError("");

    // Validación en tiempo real para email del titular
    if (name === 'correoTitular') {
      debouncedValidateEmail(value, 'correoTitular');
    }

    // Progreso automático
    if (name === 'correoTitular' && validateEmail(value)) {
      setActiveStep(Math.max(activeStep, 1));
    }
    if (name === 'tarifaId' && value) {
      setActiveStep(Math.max(activeStep, 2));
    }
  };

  const handleCorreoParticipanteChange = (index, value) => {
    const actualizados = [...correosParticipantes];
    actualizados[index] = value;
    setCorreosParticipantes(actualizados);
    
    // Limpiar errores de participantes
    if (validationErrors[`participante_${index}`]) {
      setValidationErrors(prev => ({ ...prev, [`participante_${index}`]: null }));
    }
    
    // Verificar duplicados en tiempo real
    const emailsValidos = actualizados.filter(email => email.trim() !== "");
    const emailLower = value.toLowerCase().trim();
    const esDuplicado = emailsValidos.filter(email => email.toLowerCase().trim() === emailLower).length > 1;
    
    if (esDuplicado && value.trim() !== "") {
      setValidationErrors(prev => ({ 
        ...prev, 
        [`participante_${index}`]: "Este email está duplicado" 
      }));
    }
    
    // Validación en tiempo real para participantes
    const fieldKey = `participante_${index}`;
    if (!esDuplicado) {
      debouncedValidateEmail(value, fieldKey);
    }
    
    // Progreso cuando se agregan participantes válidos
    const emailsValidosUnicos = emailsValidos.filter((email, idx) => {
      const emailCheck = email.trim();
      return emailCheck !== "" && 
             validateEmail(emailCheck) && 
             emailsValidos.findIndex(e => e.toLowerCase().trim() === emailCheck.toLowerCase()) === idx;
    });
    
    if (emailsValidosUnicos.length > 0) {
      setActiveStep(Math.max(activeStep, 2));
    }
  };

  const agregarParticipante = () => {
    if (correosParticipantes.length < 15) { // Límite de karts
      setCorreosParticipantes([...correosParticipantes, ""]);
    }
  };

  const eliminarParticipante = (index) => {
    if (correosParticipantes.length > 1) {
      const actualizados = correosParticipantes.filter((_, i) => i !== index);
      setCorreosParticipantes(actualizados);
      
      // Limpiar estado de validación del participante eliminado
      const fieldKey = `participante_${index}`;
      if (emailValidationStates[fieldKey]) {
        setEmailValidationStates(prev => {
          const newState = { ...prev };
          delete newState[fieldKey];
          return newState;
        });
      }
      
      // Limpiar timeout si existe
      if (emailValidationTimeouts[fieldKey]) {
        clearTimeout(emailValidationTimeouts[fieldKey]);
        setEmailValidationTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[fieldKey];
          return newTimeouts;
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validación completa
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Por favor corrige los errores en el formulario");
      setIsLoading(false);
      return;
    }

    try {
      const tarifa = tarifas.find(t => t.id == form.tarifaId);
      if (!tarifa) throw new Error("Tarifa inválida");

      // Filtrar emails válidos
      const emailsParticipantes = correosParticipantes.filter(email => email.trim() !== "");

      const payload = {
        correoTitular: form.correoTitular,
        correosParticipantes: emailsParticipantes,
        numeroVueltas: tarifa.numeroVueltas,
        fechaHoraReserva: form.fechaHoraReserva.format('YYYY-MM-DDTHH:mm:ss')
      };

      const response = await reservaService.create(payload);
      setReservaId(response.data.id);
      setSuccess(true);
      setActiveStep(3);
      
    } catch (err) {
      console.error(err);
      
      // Manejo específico para diferentes tipos de errores
      let errorMessage = "";
      
      if (err.response?.status === 500) {
        // Error 500 - mostrar siempre el mensaje de karts no disponibles
        errorMessage = `No hay suficientes karts disponibles para esta reserva.\n\n` +
                      `Participantes solicitados: ${correosParticipantes.filter(email => email.trim() !== "").length}\n` +
                      `Fecha/Hora: ${form.fechaHoraReserva.format('DD/MM/YYYY HH:mm')}\n\n` +
                      `Sugerencias:\n` +
                      `• Reduce el número de participantes\n` +
                      `• Selecciona otro horario disponible\n` +
                      `• Contacta al administrador para más información`;
      } else if (err.response?.status === 400) {
        // Error de validación
        const backendMessage = err.response?.data?.message || "";
        errorMessage = `Error de validación: ${backendMessage}`;
      } else if (err.response?.status === 409) {
        // Conflicto (por ejemplo, horario ya reservado)
        const backendMessage = err.response?.data?.message || "";
        errorMessage = `Conflicto en la reserva: ${backendMessage}`;
      } else {
        // Otros errores
        const backendMessage = err.response?.data?.message || err.message || "";
        errorMessage = backendMessage || "Error al crear la reserva. Por favor, inténtalo nuevamente.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const calcularDescuentoPorPersonas = (cantidadParticipantes) => {
    if (cantidadParticipantes >= 11) return 0.30; // 30%
    if (cantidadParticipantes >= 6) return 0.20;  // 20%
    if (cantidadParticipantes >= 3) return 0.10;  // 10%
    return 0; // 0%
  };

  const calcularDescuentoEspecial = (fechaReserva) => {
    if (!fechaReserva) return { descuento: 0, tipo: '' };
    
    // Verificar si es cumpleaños
    if (fechaNacimientoTitular) {
      const fechaNacimiento = dayjs(fechaNacimientoTitular);
      const diaReserva = fechaReserva.format('MM-DD');
      const diaCumpleanos = fechaNacimiento.format('MM-DD');
      
      if (diaReserva === diaCumpleanos) {
        return { descuento: 0.50, tipo: 'Cumpleaños' };
      }
    }
    
    // Verificar si es feriado
    if (esFeriado(fechaReserva)) {
      return { descuento: 0.20, tipo: 'Feriado' };
    }
    
    // Verificar si es fin de semana
    const diaSemana = fechaReserva.day();
    if (diaSemana === 0 || diaSemana === 6) {
      return { descuento: 0.10, tipo: 'Fin de semana' };
    }
    
    return { descuento: 0, tipo: '' };
  };

  const calcularMejorDescuento = () => {
    const cantidadParticipantes = correosParticipantes.filter(email => email.trim() !== "").length;
    const descuentoPersonas = calcularDescuentoPorPersonas(cantidadParticipantes);
    const descuentoEspecial = calcularDescuentoEspecial(form.fechaHoraReserva);
    
    // Crear array con todos los descuentos disponibles
    const descuentosDisponibles = [
      { 
        descuento: descuentoPersonas, 
        tipo: cantidadParticipantes >= 3 ? `${cantidadParticipantes} participantes` : 'Sin descuento por personas',
        porcentaje: Math.round(descuentoPersonas * 100)
      },
      { 
        descuento: descuentoEspecial.descuento, 
        tipo: descuentoEspecial.tipo || 'Sin descuento especial',
        porcentaje: Math.round(descuentoEspecial.descuento * 100)
      },
      { 
        descuento: descuentoFrecuencia, 
        tipo: descuentoFrecuencia > 0 ? `Frecuencia del cliente` : 'Sin descuento por frecuencia',
        porcentaje: Math.round(descuentoFrecuencia * 100)
      }
    ];
    
    // Encontrar el mejor descuento
    const mejorDescuento = descuentosDisponibles.reduce((mejor, actual) => 
      actual.descuento > mejor.descuento ? actual : mejor
    );
    
    return mejorDescuento.descuento > 0 ? mejorDescuento : { descuento: 0, tipo: 'Sin descuento', porcentaje: 0 };
  };

  const calcularCostoTotal = () => {
    if (!form.tarifaId) return 0;
    const tarifa = tarifas.find(t => t.id == form.tarifaId);
    const precioBase = tarifa ? tarifa.precio : 0;
    const cantidadParticipantes = correosParticipantes.filter(email => email.trim() !== "").length;
    const subtotalSinDescuento = precioBase * cantidadParticipantes;
    const mejorDescuento = calcularMejorDescuento();
    const subtotalConDescuento = subtotalSinDescuento * (1 - mejorDescuento.descuento);
    // Aplicar IVA (19%) al subtotal con descuento
    return subtotalConDescuento * 1.19;
  };

  const calcularSubtotal = () => {
    if (!form.tarifaId) return 0;
    const tarifa = tarifas.find(t => t.id == form.tarifaId);
    const precioBase = tarifa ? tarifa.precio : 0;
    const cantidadParticipantes = correosParticipantes.filter(email => email.trim() !== "").length;
    const subtotalSinDescuento = precioBase * cantidadParticipantes;
    const mejorDescuento = calcularMejorDescuento();
    // Subtotal con descuento aplicado pero sin IVA
    return subtotalSinDescuento * (1 - mejorDescuento.descuento);
  };

  const calcularIVA = () => {
    const subtotal = calcularSubtotal();
    return subtotal * 0.19;
  };

  // Función para obtener frecuencia mensual del titular
  const obtenerFrecuenciaMensual = async (clienteId, fechaReserva) => {
    if (!clienteId || !fechaReserva) {
      console.log('No se puede obtener frecuencia - falta clienteId o fechaReserva');
      return;
    }

    try {
      console.log('Obteniendo frecuencia mensual para:', { clienteId, fecha: fechaReserva.format('YYYY-MM-DD') });
      
      const response = await reservaService.getFrecuenciaMensual(
        clienteId, 
        fechaReserva.format('YYYY-MM-DD')
      );
      
      console.log('Respuesta completa del endpoint getFrecuenciaMensual:', response);
      console.log('Datos de frecuencia (response.data):', response.data);
      
      // La respuesta es un objeto con cantidadReservas
      const frecuenciaObjeto = response.data;
      console.log('Frecuencia mensual del titular (objeto):', frecuenciaObjeto);
      console.log('Tipo de dato:', typeof frecuenciaObjeto);
      
      // Extraer el número del objeto cantidadReservas
      const frecuencia = frecuenciaObjeto.cantidadReservas;
      console.log('Frecuencia extraída (cantidadReservas):', frecuencia);
      console.log('Tipo de dato de frecuencia:', typeof frecuencia);
      
      // Ahora obtener el descuento basado en la frecuencia
      console.log('Obteniendo descuento por frecuencia para:', frecuencia);
      
      // Asegurar que se pase solo el número, no un objeto
      const frecuenciaNumero = Number(frecuencia);
      console.log('Frecuencia convertida a número:', frecuenciaNumero);
      
      // Validar que el número sea válido
      if (isNaN(frecuenciaNumero)) {
        console.error('Error: frecuencia no es un número válido:', frecuencia);
        return;
      }
      
      // Llamar directamente al endpoint del descuento
      const descuentoUrl = `http://localhost:8090/api/descuento-frecuencia?Frecuencia=${frecuenciaNumero}`;
      console.log('Llamando directamente al endpoint:', descuentoUrl);
      
      const descuentoResponse = await fetch(descuentoUrl);
      
      if (!descuentoResponse.ok) {
        throw new Error(`Error en la respuesta del servidor: ${descuentoResponse.status}`);
      }
      
      const descuentoPorcentaje = await descuentoResponse.json();
      
      console.log('Respuesta completa del endpoint getDescuentoFrecuencia:', descuentoPorcentaje);
      console.log('Descuento por frecuencia:', descuentoPorcentaje + '%');
      console.log('Tipo de dato del descuento:', typeof descuentoPorcentaje);
      
      // Guardar el descuento en el estado (convertir de porcentaje a decimal)
      setDescuentoFrecuencia(descuentoPorcentaje / 100);
      console.log('Descuento por frecuencia guardado en estado:', descuentoPorcentaje / 100);
      
    } catch (error) {
      console.error('Error al obtener frecuencia mensual o descuento:', error);
      // Limpiar el descuento por frecuencia si hay un error
      setDescuentoFrecuencia(0);
    }
  };

  // Efecto para obtener frecuencia mensual cuando cambie el titular o fecha
  useEffect(() => {
    if (clienteTitularId && form.fechaHoraReserva) {
      obtenerFrecuenciaMensual(clienteTitularId, form.fechaHoraReserva);
    }
  }, [clienteTitularId, form.fechaHoraReserva]);

  if (success) {
    return (
      <Box sx={{ p: 3, maxWidth: 700, mx: "auto", textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 2, color: "#27ae60" }}>
          ¡Reserva Confirmada!
        </Typography>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Detalles de tu Reserva #{reservaId}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Titular:</strong> {form.correoTitular}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Fecha y Hora:</strong> {form.fechaHoraReserva.format('DD/MM/YYYY HH:mm')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Participantes:</strong> {correosParticipantes.filter(email => email.trim() !== "").length}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Costo Total:</strong> ${calcularCostoTotal().toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Alert severity="success" sx={{ mb: 3 }}>
          Se ha enviado un comprobante de reserva por correo electrónico a todos los participantes.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleBackToHome}>
            Volver al Inicio
          </Button>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Hacer Otra Reserva
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      {/* Header con información clara */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1, color: "#2c3e50" }}>
          Nueva Reserva de Karting
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "#6c757d" }}>
          Completa los siguientes datos para reservar tu experiencia en KartingRM
        </Typography>
        
        {/* Indicador de progreso */}
        <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Información de descuentos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: "#27ae60" }}>
            Descuentos Disponibles
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Descuentos por número de personas */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: "#2c3e50" }}>
                Descuento por Número de Personas
              </Typography>
              <Box sx={{ backgroundColor: "#f8f9fa", p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>• 1-2 personas: 0% descuento</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>• 3-5 personas: 10% descuento</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>• 6-10 personas: 20% descuento</Typography>
                <Typography variant="body2">• 11-15 personas: 30% descuento</Typography>
              </Box>
            </Box>

            {/* Descuentos por frecuencia de cliente */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: "#2c3e50" }}>
                Descuento por Frecuencia de Cliente
              </Typography>
              <Box sx={{ backgroundColor: "#f8f9fa", p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>• No frecuente (0-1 vez/mes): 0% descuento</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>• Regular (2-4 veces/mes): 10% descuento</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>• Frecuente (5-6 veces/mes): 20% descuento</Typography>
                <Typography variant="body2">• Muy frecuente (7+ veces/mes): 30% descuento</Typography>
              </Box>
            </Box>

            {/* Descuentos especiales */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: "#2c3e50" }}>
                Descuentos Especiales
              </Typography>
              <Box sx={{ backgroundColor: "#fff3cd", p: 2, borderRadius: 1, border: "1px solid #ffeaa7" }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Cumpleaños: 50% descuento</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>Feriados: 20% descuento</Typography>
                <Typography variant="body2">Fines de semana: 10% descuento</Typography>
              </Box>
            </Box>

            {/* Nota importante */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: "#e74c3c" }}>
                Nota Importante
              </Typography>
              <Box sx={{ backgroundColor: "#ffebee", p: 2, borderRadius: 1, border: "1px solid #ffcdd2" }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  Los descuentos se calculan automáticamente según las condiciones de la reserva. 
                  No se pueden acumular múltiples descuentos, se aplicará el mayor descuento elegible.
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Información importante */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Información importante:</strong><br />
          • Capacidad máxima: 15 participantes por reserva (Se aplican restricciones dependiendo del stock de karts en el horario reservado)<br />
          • Se enviará confirmación por correo a todos los participantes<br />
          • <strong>Todos los participantes deben estar registrados previamente en el sistema</strong><br />
          <br />
          <strong>Horarios de atención:</strong><br />
          • Lunes a viernes: 14:00 - 22:00 horas<br />
          • Sábados, domingos y feriados: 10:00 - 22:00 horas
        </Typography>
      </Alert>

      <Box component="form" onSubmit={handleSubmit}>
        {/* Sección 1: Información del Titular */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: "#495057" }}>
              1. Información del Titular de la Reserva
            </Typography>
            
            <TextField
              label="Correo Electrónico del Titular"
              name="correoTitular"
              type="email"
              required
              fullWidth
              value={form.correoTitular}
              onChange={handleChangeForm}
              error={!!validationErrors.correoTitular || emailValidationStates.correoTitular?.status === 'notFound' || emailValidationStates.correoTitular?.status === 'invalid'}
              helperText={
                validationErrors.correoTitular || 
                emailValidationStates.correoTitular?.message || 
                "La persona responsable de la reserva"
              }
              placeholder="titular@email.com"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getValidationIcon()}
                  </InputAdornment>
                )
              }}
              FormHelperTextProps={{
                sx: { 
                  color: getHelperTextColor('correoTitular'),
                  fontWeight: emailValidationStates.correoTitular?.status ? 'medium' : 'normal'
                }
              }}
              sx={{ mb: 2 }}
            />
          </CardContent>
        </Card>

        {/* Sección 2: Participantes */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: "#495057" }}>
              2. Participantes ({correosParticipantes.filter(email => email.trim() !== "").length}/15)
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2, color: "#6c757d" }}>
              Agrega el correo de cada persona que participará en la experiencia
            </Typography>

            {correosParticipantes.map((correo, index) => {
              const fieldKey = `participante_${index}`;
              return (
                <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
                  <TextField
                    type="email"
                    label={`Participante ${index + 1}`}
                    value={correo}
                    required
                    fullWidth
                    onChange={(e) => handleCorreoParticipanteChange(index, e.target.value)}
                    error={
                      !!validationErrors[fieldKey] || 
                      emailValidationStates[fieldKey]?.status === 'notFound' || 
                      emailValidationStates[fieldKey]?.status === 'invalid'
                    }
                    helperText={
                      validationErrors[fieldKey] || 
                      emailValidationStates[fieldKey]?.message || 
                      ""
                    }
                    placeholder="participante@email.com"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {getValidationIcon()}
                        </InputAdornment>
                      )
                    }}
                    FormHelperTextProps={{
                      sx: { 
                        color: getHelperTextColor(fieldKey),
                        fontWeight: emailValidationStates[fieldKey]?.status ? 'medium' : 'normal'
                      }
                    }}
                  />
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => eliminarParticipante(index)} 
                    disabled={correosParticipantes.length === 1}
                    sx={{ minWidth: "100px" }}
                  >
                    Eliminar
                  </Button>
                </Box>
              );
            })}

            <Button
              variant="outlined"
              onClick={agregarParticipante}
              disabled={correosParticipantes.length >= 15}
              fullWidth
              sx={{ mt: 1 }}
            >
              {correosParticipantes.length >= 15 
                ? "Capacidad máxima alcanzada" 
                : "Agregar Otro Participante"
              }
            </Button>
          </CardContent>
        </Card>

        {/* Sección 3: Detalles de la Reserva */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: "#495057" }}>
              3. Detalles de la Reserva
            </Typography>

            <TextField
              select
              fullWidth
              required
              name="tarifaId"
              label="Selecciona tu paquete de vueltas"
              value={form.tarifaId}
              onChange={handleChangeForm}
              error={!!validationErrors.tarifaId}
              helperText={validationErrors.tarifaId || "Elige la cantidad de vueltas y precio"}
              sx={{ mb: 2 }}
            >
              {tarifas.map(tarifa => {
                // Calcular tiempo estimado según número de vueltas
                let tiempoEstimado = "30 min"; // Valor por defecto
                if (tarifa.numeroVueltas === 10) {
                  tiempoEstimado = "30 min";
                } else if (tarifa.numeroVueltas === 15) {
                  tiempoEstimado = "35 min";
                } else if (tarifa.numeroVueltas === 20) {
                  tiempoEstimado = "40 min";
                }
                
                return (
                  <MenuItem key={tarifa.id} value={tarifa.id}>
                    {tarifa.numeroVueltas} vueltas – ${tarifa.precio.toLocaleString()} por persona - Tiempo estimado: {tiempoEstimado}
                  </MenuItem>
                );
              })}
            </TextField>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Fecha y Hora de la Reserva
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 1 }}>
                {/* Selector de Año */}
                <TextField
                  select
                  label="Año"
                  value={form.fechaHoraReserva.year()}
                  onChange={(e) => {
                    const nuevaFecha = form.fechaHoraReserva.year(parseInt(e.target.value));
                    setForm({ ...form, fechaHoraReserva: nuevaFecha });
                    if (validationErrors.fechaHoraReserva) {
                      setValidationErrors(prev => ({ ...prev, fechaHoraReserva: null }));
                    }
                  }}
                  size="small"
                >
                  {[2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>

                {/* Selector de Mes */}
                <TextField
                  select
                  label="Mes"
                  value={form.fechaHoraReserva.month() + 1}
                  onChange={(e) => {
                    const nuevaFecha = form.fechaHoraReserva.month(parseInt(e.target.value) - 1);
                    setForm({ ...form, fechaHoraReserva: nuevaFecha });
                    if (validationErrors.fechaHoraReserva) {
                      setValidationErrors(prev => ({ ...prev, fechaHoraReserva: null }));
                    }
                  }}
                  size="small"
                >
                  {[
                    { value: 1, label: 'Enero' },
                    { value: 2, label: 'Febrero' },
                    { value: 3, label: 'Marzo' },
                    { value: 4, label: 'Abril' },
                    { value: 5, label: 'Mayo' },
                    { value: 6, label: 'Junio' },
                    { value: 7, label: 'Julio' },
                    { value: 8, label: 'Agosto' },
                    { value: 9, label: 'Septiembre' },
                    { value: 10, label: 'Octubre' },
                    { value: 11, label: 'Noviembre' },
                    { value: 12, label: 'Diciembre' }
                  ].map(mes => (
                    <MenuItem key={mes.value} value={mes.value}>{mes.label}</MenuItem>
                  ))}
                </TextField>

                {/* Selector de Día */}
                <TextField
                  select
                  label="Día"
                  value={form.fechaHoraReserva.date()}
                  onChange={(e) => {
                    const nuevaFecha = form.fechaHoraReserva.date(parseInt(e.target.value));
                    setForm({ ...form, fechaHoraReserva: nuevaFecha });
                    setActiveStep(Math.max(activeStep, 3));
                    if (validationErrors.fechaHoraReserva) {
                      setValidationErrors(prev => ({ ...prev, fechaHoraReserva: null }));
                    }
                  }}
                  size="small"
                >
                  {Array.from({ length: form.fechaHoraReserva.daysInMonth() }, (_, i) => i + 1).map(dia => (
                    <MenuItem key={dia} value={dia}>{dia}</MenuItem>
                  ))}
                </TextField>

                {/* Selector de Hora */}
                <TextField
                  select
                  label="Hora"
                  value={form.fechaHoraReserva.hour()}
                  onChange={(e) => {
                    const nuevaFecha = form.fechaHoraReserva.hour(parseInt(e.target.value));
                    setForm({ ...form, fechaHoraReserva: nuevaFecha });
                    if (validationErrors.fechaHoraReserva) {
                      setValidationErrors(prev => ({ ...prev, fechaHoraReserva: null }));
                    }
                  }}
                  size="small"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(hora => (
                    <MenuItem key={hora} value={hora}>
                      {hora.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Selector de Minutos */}
                <TextField
                  select
                  label="Minutos"
                  value={form.fechaHoraReserva.minute()}
                  onChange={(e) => {
                    const nuevaFecha = form.fechaHoraReserva.minute(parseInt(e.target.value));
                    setForm({ ...form, fechaHoraReserva: nuevaFecha });
                    if (validationErrors.fechaHoraReserva) {
                      setValidationErrors(prev => ({ ...prev, fechaHoraReserva: null }));
                    }
                  }}
                  size="small"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minuto => (
                    <MenuItem key={minuto} value={minuto}>
                      {minuto.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Mostrar fecha seleccionada */}
              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
                  Fecha seleccionada: {form.fechaHoraReserva.format('dddd, DD [de] MMMM [de] YYYY [a las] HH:mm')}
                </Typography>
              </Box>

              {/* Helper text con validación */}
              {validationErrors.fechaHoraReserva ? (
                <Typography variant="caption" sx={{ color: '#f44336', ml: 1 }}>
                  {validationErrors.fechaHoraReserva}
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: '#6c757d', ml: 1 }}>
                  Horario permitido: {obtenerHorarioPermitido(form.fechaHoraReserva)} {esFeriado(form.fechaHoraReserva) ? '(feriado)' : ''}
                </Typography>
              )}
            </Box>

            {/* Resumen de costos */}
            {form.tarifaId && (
              <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 1, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Resumen de Costos
                </Typography>
                <Typography variant="body1">
                  Participantes: {correosParticipantes.filter(email => email.trim() !== "").length}
                </Typography>
                <Typography variant="body1">
                  Tarifa por persona: ${tarifas.find(t => t.id == form.tarifaId)?.precio.toLocaleString()}
                </Typography>
                
                {(() => {
                  const mejorDescuento = calcularMejorDescuento();
                  return (
                    <Typography variant="body1" sx={{ color: mejorDescuento.descuento > 0 ? "#27ae60" : "#666" }}>
                      Descuento aplicado: {mejorDescuento.porcentaje}% ({mejorDescuento.tipo})
                    </Typography>
                  );
                })()}
                
                <Typography variant="body1">
                  Subtotal con descuento: ${calcularSubtotal().toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  IVA (19%): ${calcularIVA().toLocaleString()}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ color: "#27ae60" }}>
                  Total: ${calcularCostoTotal().toLocaleString()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Estado de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleBackToHome}
            disabled={isLoading}
            sx={{ flex: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            type="submit" 
            disabled={isLoading || !form.correoTitular || !form.tarifaId}
            sx={{ flex: 2 }}
          >
            {isLoading ? "Procesando Reserva..." : "Confirmar Reserva"}
          </Button>
        </Box>

        {/* Indicador de carga */}
        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center", color: "#6c757d" }}>
              Creando tu reserva y enviando confirmaciones...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
