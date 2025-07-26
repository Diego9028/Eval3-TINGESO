import { useState } from "react";
import clienteService from "../services/cliente.service";
import { useNavigate } from "react-router-dom";
import {
  Box, TextField, Button, Typography, Alert, LinearProgress, Stepper, Step, StepLabel
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    rut: "",
    nombre: "",
    email: "",
    telefono: "",
    fechaNacimiento: dayjs(),
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const steps = ['Información Personal', 'Datos de Contacto', 'Confirmación'];
  const [activeStep, setActiveStep] = useState(0);

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'rut':
        if (!value) {
          errors.rut = 'El RUT es obligatorio';
        } else if (!/^\d{7,8}-[\dkK]$/.test(value)) {
          errors.rut = 'Formato de RUT inválido (ej: 12345678-9)';
        }
        break;
      case 'nombre':
        if (!value) {
          errors.nombre = 'El nombre es obligatorio';
        } else if (value.length < 2) {
          errors.nombre = 'El nombre debe tener al menos 2 caracteres';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          errors.nombre = 'El nombre solo puede contener letras y espacios';
        } else if (value.trim().length === 0) {
          errors.nombre = 'El nombre no puede estar vacío';
        }
        break;
      case 'email':
        if (!value) {
          errors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Formato de email inválido';
        }
        break;
      case 'telefono':
        if (!value) {
          errors.telefono = 'El teléfono es obligatorio';
        } else if (!/^\+?56\d{8,9}$/.test(value.replace(/\s/g, ''))) {
          errors.telefono = 'Formato de teléfono chileno inválido (+56912345678)';
        }
        break;
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    const fieldErrors = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || null
    }));
    
    // Limpiar errores generales cuando el usuario empiece a escribir
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validación completa antes del envío
    const allErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'fechaNacimiento') {
        const fieldErrors = validateField(key, formData[key]);
        Object.assign(allErrors, fieldErrors);
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setError("Por favor corrige los errores en el formulario");
      setIsLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento.format("YYYY-MM-DD"),
      };

      // Verificar si el RUT o Email ya existen
      const existeRut = await clienteService.buscarPorRut(formData.rut);
      if (existeRut) {
        setError("Ya existe un cliente registrado con este RUT. ¿Ya tienes una cuenta?");
        setIsLoading(false);
        return;
      }

      const existeEmail = await clienteService.buscarPorEmail(formData.email);
      if (existeEmail) {
        setError("Ya existe un cliente registrado con este email. ¿Ya tienes una cuenta?");
        setIsLoading(false);
        return;
      }

      await clienteService.crear(submitData);
      setSuccess(true);
      setActiveStep(2);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate("/", { state: { message: "¡Registro exitoso! Ya puedes hacer reservas." } });
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError("Error del servidor. Por favor, inténtalo de nuevo en unos momentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (success) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto", textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 2, color: "#27ae60" }}>
          ¡Registro Exitoso!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: "#6c757d" }}>
          Tu cuenta ha sido creada correctamente. Serás redirigido al inicio en unos segundos.
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Button 
          variant="outlined" 
          onClick={handleBackToHome}
          sx={{ mt: 2 }}
        >
          Ir al Inicio Ahora
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      {/* Header con información clara */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1, color: "#2c3e50" }}>
          Registro de Cliente
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "#6c757d" }}>
          Completa tus datos para crear tu cuenta en KartingRM
        </Typography>
        
        {/* Indicador de progreso visual */}
        <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Información de ayuda */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>¿Por qué necesitamos esta información?</strong><br />
          • RUT y nombre: Para identificarte en el sistema<br />
          • Email: Para confirmaciones de reserva<br />
          • Teléfono: Para contactarte en caso necesario<br />
          • Fecha de nacimiento: Para descuentos por edad
        </Typography>
      </Alert>

      {/* Formulario */}
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" sx={{ mb: 2, color: "#495057" }}>
          Información Personal
        </Typography>

        <TextField
          label="RUT (formato: 12345678-9)"
          name="rut"
          required
          fullWidth
          value={formData.rut}
          onChange={handleChange}
          error={!!validationErrors.rut}
          helperText={validationErrors.rut || "Ingresa tu RUT con guión y dígito verificador"}
          sx={{ mb: 2 }}
          placeholder="12345678-9"
        />

        <TextField
          label="Nombre Completo"
          name="nombre"
          required
          fullWidth
          value={formData.nombre}
          onChange={handleChange}
          error={!!validationErrors.nombre}
          helperText={validationErrors.nombre || "Tu nombre como aparece en tu documento de identidad"}
          sx={{ mb: 2 }}
          placeholder="Juan Pérez García"
        />

        <Typography variant="h6" sx={{ mb: 2, mt: 3, color: "#495057" }}>
          Datos de Contacto
        </Typography>

        <TextField
          label="Correo Electrónico"
          name="email"
          type="email"
          required
          fullWidth
          value={formData.email}
          onChange={handleChange}
          error={!!validationErrors.email}
          helperText={validationErrors.email || "Usaremos este email para enviarte confirmaciones"}
          sx={{ mb: 2 }}
          placeholder="juan.perez@email.com"
        />

        <TextField
          label="Teléfono (+56912345678)"
          name="telefono"
          required
          fullWidth
          value={formData.telefono}
          onChange={handleChange}
          error={!!validationErrors.telefono}
          helperText={validationErrors.telefono || "Incluye código de país (+56) para Chile"}
          sx={{ mb: 2 }}
          placeholder="+56912345678"
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha de Nacimiento"
            value={formData.fechaNacimiento}
            onChange={(date) => {
              setFormData(prev => ({ ...prev, fechaNacimiento: date }));
              setActiveStep(1);
            }}
            maxDate={dayjs().subtract(13, 'year')}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                required: true, 
                sx: { mb: 3 },
                helperText: "Debe ser mayor de 13 años para usar el servicio"
              } 
            }}
          />
        </LocalizationProvider>

        {/* Estado de errores */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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
            disabled={isLoading}
            sx={{ flex: 2 }}
          >
            {isLoading ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </Box>

        {/* Indicador de carga */}
        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center", color: "#6c757d" }}>
              Verificando datos y creando tu cuenta...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer con información adicional */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
        <Typography variant="body2" sx={{ color: "#6c757d", textAlign: "center" }}>
          Al registrarte, aceptas nuestros términos de servicio y política de privacidad. 
          Tus datos están protegidos y solo se usan para mejorar tu experiencia en KartingRM.
        </Typography>
      </Box>
    </Box>
  );
}
