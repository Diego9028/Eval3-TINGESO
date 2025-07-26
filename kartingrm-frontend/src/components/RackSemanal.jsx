import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  TextField
} from "@mui/material";
import axios from "../http-common";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/es";

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.locale("es");

const HOURS = Array.from({ length: 13 }, (_, i) => i + 10);
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function RackSemanal() {
  const navigate = useNavigate();
  const [primerDia, setPrimerDia] = useState(() =>
    dayjs().isoWeekday(1).startOf("day")
  );

  const [reservas, setReservas] = useState([]);
  const [tarifasCache, setTarifasCache] = useState({});
  const [nombresPorId, setNombresPorId] = useState({});
  const [rutsPorId, setRutsPorId] = useState({});
  const [tarifasListas, setTarifasListas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false, reserva: null });
  const [secondConfirmDialog, setSecondConfirmDialog] = useState({ open: false, reserva: null });
  const [deletingReserva, setDeletingReserva] = useState(null);
  const [rutInput, setRutInput] = useState("");
  const [rutError, setRutError] = useState("");

  const obtenerDatosClientePorId = useCallback(async (id) => {
    if (!id || (nombresPorId[id] && rutsPorId[id])) return;

    try {
      const { data } = await axios.get(`/api/clientes/${id}`);
      if (data && data.nombre && data.rut) {
        setNombresPorId(prev => ({ ...prev, [id]: data.nombre }));
        setRutsPorId(prev => ({ ...prev, [id]: data.rut }));
      }
    } catch (err) {
      console.warn(`No se encontró cliente con ID: ${id}`);
      // En caso de error, mostrar el ID como fallback
      setNombresPorId(prev => ({ ...prev, [id]: `Cliente #${id}` }));
      setRutsPorId(prev => ({ ...prev, [id]: "RUT no disponible" }));
    }
  }, [nombresPorId, rutsPorId]);

  const fetchSemana = useCallback(async (lunes) => {
    const anio = lunes.year();
    const semana = lunes.isoWeek();
    
    setIsLoading(true);
    setError("");

    try {
      const { data } = await axios.get("/api/rack-semanal", {
        params: { anio, semana }
      });

      setReservas(data);

      // Cargar nombres y RUTs de clientes de forma asíncrona
      for (const r of data) {
        await obtenerDatosClientePorId(r.clienteTitularId);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar las reservas de la semana. Por favor, inténtalo nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [obtenerDatosClientePorId]);

  useEffect(() => {
    fetchSemana(primerDia);
  }, [primerDia, fetchSemana]);

  const fetchDuracionVueltas = useCallback(async (vueltas) => {
    if (tarifasCache[vueltas]) return tarifasCache[vueltas];
    try {
      const { data } = await axios.get(`/api/tarifas/by-vueltas?numeroVueltas=${vueltas}`);
      const duracion = data.duracionTotalMinutos;
      setTarifasCache(prev => ({ ...prev, [vueltas]: duracion }));
      return duracion;
    } catch (err) {
      console.error("No se pudo obtener duración para", vueltas, "vueltas");
      return 0;
    }
  }, [tarifasCache]);

  useEffect(() => {
    const cargarDuraciones = async () => {
      const vueltasUnicas = [...new Set(reservas.map(r => r.numeroVueltas))];
      for (const v of vueltasUnicas) {
        await fetchDuracionVueltas(v);
      }
      setTarifasListas(true);
    };
    if (reservas.length > 0) cargarDuraciones();
  }, [reservas, fetchDuracionVueltas]);

  const reservasEnCelda = (dayIdx, hour) => {
    const cellStart = primerDia.clone().add(dayIdx, "day").hour(hour).minute(0);
    const cellEnd = cellStart.clone().add(1, "hour");

    return reservas.filter((r) => {
      const inicio = dayjs(r.fechaHoraReserva);
      const duracionMin = tarifasCache[r.numeroVueltas];
      if (!duracionMin || !inicio.isValid()) return false;

      const fin = inicio.add(duracionMin, "minute");

      return fin.isAfter(cellStart) && inicio.isBefore(cellEnd);
    });
  };

  const avanzarSemana = () => {
    setError("");
    setPrimerDia(primerDia.add(7, "day"));
  };
  
  const retrocederSemana = () => {
    setError("");
    setPrimerDia(primerDia.subtract(7, "day"));
  };

  const irAHoy = () => {
    setError("");
    setPrimerDia(dayjs().isoWeekday(1).startOf("day"));
  };

  const borrarReserva = async (reserva) => {
    if (!reserva) return;
    
    setDeletingReserva(reserva.id);
    setError("");

    try {
      await axios.delete(`/api/reservas/eliminar/${reserva.id}`);
      setConfirmDialog({ open: false, reserva: null });
      setSecondConfirmDialog({ open: false, reserva: null });
      
      // Recargar datos
      setTarifasListas(false);
      await fetchSemana(primerDia);
      
      // Mostrar confirmación de éxito
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al eliminar la reserva. Por favor, inténtalo nuevamente.");
    } finally {
      setDeletingReserva(null);
    }
  };

  const handleDeleteClick = (reserva) => {
    setConfirmDialog({ open: true, reserva });
    setRutInput("");
    setRutError("");
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, reserva: null });
    setRutInput("");
    setRutError("");
  };

  const handleConfirmDelete = () => {
    if (!rutInput.trim()) {
      setRutError("Debes ingresar el RUT del titular");
      return;
    }

    const rutEsperado = rutsPorId[confirmDialog.reserva.clienteTitularId];
    if (!rutEsperado) {
      setRutError("No se pudo verificar el RUT del titular");
      return;
    }

    // Comparar RUTs sin formato (solo números y dígito verificador)
    const rutInputLimpio = rutInput.replace(/[^0-9kK]/g, '').toLowerCase();
    const rutEsperadoLimpio = rutEsperado.replace(/[^0-9kK]/g, '').toLowerCase();

    if (rutInputLimpio !== rutEsperadoLimpio) {
      setRutError("El RUT ingresado no coincide con el titular de la reserva");
      return;
    }

    // Cerrar el primer diálogo y abrir el segundo
    setConfirmDialog({ open: false, reserva: null });
    setSecondConfirmDialog({ open: true, reserva: confirmDialog.reserva });
    setRutInput("");
    setRutError("");
  };

  const handleCancelSecondDelete = () => {
    setSecondConfirmDialog({ open: false, reserva: null });
  };

  const handleFinalConfirmDelete = () => {
    borrarReserva(secondConfirmDialog.reserva);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header con navegación clara */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" sx={{ color: "#2c3e50" }}>
            Planificación Semanal de Reservas
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate("/")}
            sx={{ minWidth: "120px" }}
          >
            Volver al Inicio
          </Button>
        </Box>
        
        <Typography variant="body1" sx={{ color: "#6c757d", mb: 3 }}>
          Visualiza y gestiona las reservas de la semana. Haz clic en una reserva para eliminarla.
        </Typography>

        {/* Controles de navegación de semana */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={retrocederSemana}
                disabled={isLoading}
                sx={{ minWidth: "140px" }}
              >
                Semana Anterior
              </Button>
              
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Semana del {primerDia.format("DD/MM/YYYY")} al {primerDia.clone().add(6, "day").format("DD/MM/YYYY")}
                </Typography>
                <Chip 
                  label={`Semana ${primerDia.isoWeek()} de ${primerDia.year()}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button 
                  variant="text" 
                  onClick={irAHoy}
                  disabled={isLoading}
                  size="small"
                >
                  Ir a Semana Actual
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={avanzarSemana}
                  disabled={isLoading}
                  sx={{ minWidth: "140px" }}
                >
                  Semana Siguiente
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Información de ayuda */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Cómo usar este calendario:</strong><br />
            • Las celdas azules indican horarios con reservas<br />
            • Haz clic en una reserva para ver opciones de eliminación<br />
            • Las reservas muestran el nombre del titular y horario exacto<br />
            • Navega entre semanas usando los botones de arriba
          </Typography>
        </Alert>
      </Box>

      {/* Indicador de carga */}
      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center", color: "#6c757d" }}>
            Cargando reservas de la semana...
          </Typography>
        </Box>
      )}

      {/* Mensajes de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grid del calendario */}
      {!isLoading && (
        <Card>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "120px repeat(7, 1fr)",
              gap: "2px",
              backgroundColor: "#f8f9fa"
            }}>
              {/* Celda vacía esquina superior izquierda */}
              <Box sx={{ p: 1 }}></Box>
              
              {/* Headers de días */}
              {DAYS.map((d, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    p: 1, 
                    fontWeight: "bold", 
                    textAlign: "center",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px"
                  }}
                >
                  <Typography variant="subtitle2">{d}</Typography>
                  <Typography variant="caption" sx={{ color: "#6c757d" }}>
                    {primerDia.clone().add(i, "day").format("DD/MM")}
                  </Typography>
                </Box>
              ))}

              {/* Filas de horas */}
              {tarifasListas && HOURS.map(hour => (
                <Fragment key={hour}>
                  {/* Header de hora */}
                  <Box sx={{ 
                    p: 1, 
                    fontWeight: "bold", 
                    textAlign: "center",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Typography variant="body2">{hour}:00</Typography>
                  </Box>
                  
                  {/* Celdas de cada día para esta hora */}
                  {DAYS.map((_, dayIdx) => {
                    const reservasEnHora = reservasEnCelda(dayIdx, hour);
                    const tieneReservas = reservasEnHora.length > 0;

                    return (
                      <Box
                        key={`${dayIdx}-${hour}`}
                        sx={{
                          minHeight: "80px",
                          backgroundColor: tieneReservas ? "#e3f2fd" : "#ffffff",
                          border: tieneReservas ? "2px solid #2196f3" : "1px solid #dee2e6",
                          borderRadius: "4px",
                          p: 0.5,
                          cursor: tieneReservas ? "pointer" : "default",
                          transition: "all 0.2s ease",
                          "&:hover": tieneReservas ? {
                            backgroundColor: "#bbdefb",
                            borderColor: "#1976d2"
                          } : {}
                        }}
                      >
                        {reservasEnHora.map((reserva, idx) => {
                          const isDeleting = deletingReserva === reserva.id;
                          
                          return (
                            <Box
                              key={idx}
                              onClick={() => !isDeleting && handleDeleteClick(reserva)}
                              sx={{
                                mb: 0.5,
                                p: 0.5,
                                backgroundColor: isDeleting ? "#ffcdd2" : "#ffffff",
                                border: "1px solid #e0e0e0",
                                borderRadius: "4px",
                                cursor: isDeleting ? "not-allowed" : "pointer",
                                opacity: isDeleting ? 0.7 : 1,
                                "&:hover": !isDeleting ? {
                                  backgroundColor: "#ffebee",
                                  borderColor: "#f44336"
                                } : {},
                                transition: "all 0.2s ease"
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: "bold", 
                                  display: "block",
                                  fontSize: "0.7rem"
                                }}
                              >
                                {nombresPorId[reserva.clienteTitularId] || `Cliente #${reserva.clienteTitularId}`}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: "#666",
                                  fontSize: "0.65rem",
                                  display: "block"
                                }}
                              >
                                {dayjs(reserva.fechaHoraReserva).format("HH:mm")} - 
                                {dayjs(reserva.fechaHoraReserva)
                                  .add(tarifasCache[reserva.numeroVueltas], "minute")
                                  .format("HH:mm")}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: "#888",
                                  fontSize: "0.6rem",
                                  display: "block"
                                }}
                              >
                                {reserva.numeroVueltas} vueltas
                              </Typography>
                              {isDeleting && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: "#f44336",
                                    fontSize: "0.6rem",
                                    fontStyle: "italic"
                                  }}
                                >
                                  Eliminando...
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Fragment>
              ))}
            </Box>

            {/* Información adicional */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: "#6c757d" }}>
                <strong>Resumen:</strong> {reservas.length} reservas en esta semana
                {reservas.length > 0 && (
                  <>
                    {" • "}
                    Horarios ocupados: {[...new Set(reservas.map(r => dayjs(r.fechaHoraReserva).format("dddd")))].join(", ")}
                  </>
                )}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación de Reserva
        </DialogTitle>
        <DialogContent>
          {confirmDialog.reserva && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Para eliminar esta reserva, debes ingresar el RUT del titular.
              </Typography>
              
              <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Cliente:</strong> {nombresPorId[confirmDialog.reserva.clienteTitularId] || `Cliente #${confirmDialog.reserva.clienteTitularId}`}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Fecha:</strong> {dayjs(confirmDialog.reserva.fechaHoraReserva).format("dddd, DD/MM/YYYY")}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Horario:</strong> {dayjs(confirmDialog.reserva.fechaHoraReserva).format("HH:mm")} - 
                  {dayjs(confirmDialog.reserva.fechaHoraReserva)
                    .add(tarifasCache[confirmDialog.reserva.numeroVueltas], "minute")
                    .format("HH:mm")}
                </Typography>
                <Typography variant="body2">
                  <strong>Vueltas:</strong> {confirmDialog.reserva.numeroVueltas}
                </Typography>
              </Box>

              <TextField
                label="RUT del Titular"
                value={rutInput}
                onChange={(e) => {
                  setRutInput(e.target.value);
                  setRutError("");
                }}
                error={!!rutError}
                helperText={rutError || "Ingresa el RUT del titular para confirmar la eliminación"}
                fullWidth
                placeholder="12.345.678-9"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Alert severity="warning">
                <Typography variant="body2">
                  Esta acción no se puede deshacer. La reserva será eliminada permanentemente del sistema.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancelDelete} 
            variant="outlined"
            disabled={deletingReserva === confirmDialog.reserva?.id}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deletingReserva === confirmDialog.reserva?.id}
          >
            Verificar RUT y Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de segunda confirmación */}
      <Dialog 
        open={secondConfirmDialog.open} 
        onClose={handleCancelSecondDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", color: "#d32f2f" }}>
          ¿Estás completamente seguro?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#d32f2f" }}>
              CONFIRMACIÓN FINAL
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Esta acción eliminará permanentemente la reserva y no podrá ser recuperada.
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              ¿Deseas continuar con la eliminación?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center", gap: 2 }}>
          <Button 
            onClick={handleCancelSecondDelete} 
            variant="outlined"
            color="primary"
            disabled={deletingReserva === secondConfirmDialog.reserva?.id}
            sx={{ minWidth: "120px" }}
          >
            No, Cancelar
          </Button>
          <Button 
            onClick={handleFinalConfirmDelete}
            variant="contained"
            color="error"
            disabled={deletingReserva === secondConfirmDialog.reserva?.id}
            sx={{ minWidth: "120px" }}
          >
            {deletingReserva === secondConfirmDialog.reserva?.id ? "Eliminando..." : "Sí, Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
