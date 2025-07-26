import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Alert, LinearProgress,
  TextField, MenuItem, FormControl, InputLabel, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import reportesService from "../services/reportes.service";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/es";
dayjs.extend(isSameOrBefore);
dayjs.locale("es");

export default function Reportes() {
  const navigate = useNavigate();
  const mesActual = dayjs().format("YYYY-MM");
  const [inicioMes, setInicioMes] = useState(dayjs().startOf("month").format("YYYY-MM"));
  const [finMes, setFinMes] = useState(dayjs().format("YYYY-MM"));
  const [tipo, setTipo] = useState("vueltas");

  const [datos, setDatos] = useState({});
  const [meses, setMeses] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    const inicioDate = dayjs(inicioMes + "-01");
    const finDate = dayjs(finMes + "-01");

    if (!inicioMes) {
      errors.inicioMes = "Selecciona un mes de inicio";
    }

    if (!finMes) {
      errors.finMes = "Selecciona un mes de fin";
    }

    if (inicioMes && finMes && finDate.isBefore(inicioDate)) {
      errors.finMes = "El mes de fin debe ser posterior o igual al mes de inicio";
    }

    // Validar que no sean meses futuros
    if (inicioMes && inicioMes > mesActual) {
      errors.inicioMes = "No se pueden generar reportes de meses futuros";
    }

    if (finMes && finMes > mesActual) {
      errors.finMes = "No se pueden generar reportes de meses futuros";
    }

    return errors;
  };

  const generarListaMeses = (from, to) => {
    const lista = [];
    let cursor = from.clone();
    while (cursor.isSameOrBefore(to, "month")) {
      lista.push(cursor.clone());
      cursor = cursor.add(1, "month");
    }
    return lista;
  };

  const fetchDatos = async () => {
    // Validar formulario antes de proceder
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Por favor corrige los errores en el formulario");
      return;
    }

    setCargando(true);
    setError("");
    setValidationErrors({});
    setDatos({});
    
    const ini = dayjs(inicioMes + "-01");
    const fin = dayjs(finMes + "-01");
    const listaMeses = generarListaMeses(ini, fin);
    setMeses(listaMeses.map(m => m.format("MMM YYYY")));

    const resultadosTemp = {};

    try {
      const responses = await Promise.all(
        listaMeses.map(async (mes) => {
          const inicioISO = mes.startOf("month").format("YYYY-MM-DD") + "T00:00:00";
          const finISO = mes.endOf("month").format("YYYY-MM-DD") + "T23:59:59";

          const fetchFn =
            tipo === "personas"
              ? reportesService.ingresosPersonas
              : reportesService.ingresosVueltas; 

          const { data } = await fetchFn(inicioISO, finISO);
          return { mes: mes.format("MMM YYYY"), data };
        })
      );

      for (const { mes, data } of responses) {
        data.forEach(r => {
          if (!resultadosTemp[r.criterio]) {
            resultadosTemp[r.criterio] = { total: 0 };
          }
          resultadosTemp[r.criterio][mes] = r.totalIngresos;
          resultadosTemp[r.criterio].total += r.totalIngresos;
        });
      }

      setDatos(resultadosTemp);
      
      if (Object.keys(resultadosTemp).length === 0) {
        setError("No se encontraron datos para el período seleccionado. Intenta con un rango diferente.");
      }
    } catch (err) {
      console.error("Error al obtener los datos:", err);
      setError(
        err.response?.data?.message || 
        "Error al generar el reporte. Por favor, verifica tu conexión e inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Limpiar errores cuando el usuario cambie los valores
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
    if (error) setError("");

    if (field === 'inicioMes') {
      setInicioMes(value);
    } else if (field === 'finMes') {
      setFinMes(value);
    } else if (field === 'tipo') {
      setTipo(value);
      // Limpiar datos anteriores al cambiar tipo
      setDatos({});
    }
  };

  const calcularTotalGeneral = () => {
    return Object.values(datos).reduce((acc, v) => acc + v.total, 0);
  };

  const calcularTotalMes = (mes) => {
    return Object.values(datos).reduce((acc, v) => acc + (v[mes] || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" sx={{ color: "#2c3e50" }}>
            Reportes de Ingresos
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
          Genera reportes detallados de ingresos por período. Selecciona el rango de fechas y tipo de análisis.
        </Typography>

        {/* Información de ayuda */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Tipos de reporte disponibles:</strong><br />
            • <strong>Por vueltas o tiempo:</strong> Ingresos agrupados por cantidad de vueltas/duración<br />
            • <strong>Por número de personas:</strong> Ingresos agrupados por cantidad de participantes<br />
            <br />
            <strong>Restricciones:</strong><br />
            • Solo se pueden consultar meses transcurridos o el mes actual
          </Typography>
        </Alert>
      </Box>

      {/* Formulario de filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: "#495057" }}>
            Configuración del Reporte
          </Typography>
          
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
            <TextField
              label="Mes de Inicio"
              type="month"
              value={inicioMes}
              onChange={(e) => handleInputChange('inicioMes', e.target.value)}
              error={!!validationErrors.inicioMes}
              helperText={validationErrors.inicioMes || "Primer mes del período a analizar"}
              sx={{ minWidth: 200 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                max: mesActual 
              }}
            />

            <TextField
              label="Mes de Fin"
              type="month"
              value={finMes}
              onChange={(e) => handleInputChange('finMes', e.target.value)}
              error={!!validationErrors.finMes}
              helperText={validationErrors.finMes || "Último mes del período a analizar"}
              sx={{ minWidth: 200 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                max: mesActual 
              }}
            />

            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Tipo de Reporte</InputLabel>
              <Select
                value={tipo}
                label="Tipo de Reporte"
                onChange={(e) => handleInputChange('tipo', e.target.value)}
              >
                <MenuItem value="vueltas">Ingresos por Vueltas o Tiempo</MenuItem>
                <MenuItem value="personas">Ingresos por Número de Personas</MenuItem>
              </Select>
            </FormControl>

            <Button 
              variant="contained"
              onClick={fetchDatos}
              disabled={cargando || !inicioMes || !finMes}
              sx={{ minWidth: 150, height: 56 }}
            >
              {cargando ? "Generando..." : "Generar Reporte"}
            </Button>
          </Box>

          {/* Información del período seleccionado */}
          {inicioMes && finMes && (
            <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Período seleccionado:</strong> {dayjs(inicioMes + "-01").format("MMMM YYYY")} - {dayjs(finMes + "-01").format("MMMM YYYY")}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Duración:</strong> {dayjs(finMes + "-01").diff(dayjs(inicioMes + "-01"), 'month') + 1} meses
              </Typography>
              <Typography variant="body2">
                <strong>Tipo de análisis:</strong> {tipo === "personas" ? "Por número de personas" : "Por vueltas o tiempo"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Indicador de carga */}
      {cargando && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center", color: "#6c757d" }}>
            Generando reporte... Esto puede tomar unos momentos
          </Typography>
        </Box>
      )}

      {/* Mensajes de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de resultados */}
      {Object.keys(datos).length > 0 && !cargando && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ color: "#495057", mb: 3 }}>
              Resultados del Reporte
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#f8f9fa", fontWeight: "bold", minWidth: 200 }}>
                      {tipo === "personas" ? "Número de Personas" : "Número de Vueltas/Minutos"}
                    </TableCell>
                    {meses.map(m => (
                      <TableCell 
                        key={m} 
                        align="right"
                        sx={{ backgroundColor: "#f8f9fa", fontWeight: "bold", minWidth: 120 }}
                      >
                        {m}
                      </TableCell>
                    ))}
                    <TableCell 
                      align="right"
                      sx={{ backgroundColor: "#e3f2fd", fontWeight: "bold", minWidth: 140 }}
                    >
                      TOTAL PERÍODO
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(datos).map(([criterio, valores]) => (
                    <TableRow key={criterio} hover>
                      <TableCell sx={{ fontWeight: "medium" }}>
                        {criterio}
                      </TableCell>
                      {meses.map(m => (
                        <TableCell key={m} align="right">
                          {valores[m] ? formatCurrency(valores[m]) : "-"}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#f3e5f5" }}>
                        {formatCurrency(valores.total)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Fila de totales */}
                  <TableRow sx={{ backgroundColor: "#e8f5e8" }}>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                      TOTAL GENERAL
                    </TableCell>
                    {meses.map(m => (
                      <TableCell key={m} align="right" sx={{ fontWeight: "bold" }}>
                        {formatCurrency(calcularTotalMes(m))}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem", color: "#2e7d32" }}>
                      {formatCurrency(calcularTotalGeneral())}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Resumen estadístico */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resumen del Período
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total de Ingresos</Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(calcularTotalGeneral())}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Promedio Mensual</Typography>
                  <Typography variant="h6">
                    {formatCurrency(calcularTotalGeneral() / meses.length)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Período Analizado</Typography>
                  <Typography variant="h6">
                    {meses.length} {meses.length === 1 ? 'mes' : 'meses'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay datos */}
      {Object.keys(datos).length === 0 && !cargando && !error && inicioMes && finMes && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#6c757d" }}>
              Sin Datos Disponibles
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              No se encontraron registros para el período seleccionado.
            </Typography>
            <Alert severity="info">
              <Typography variant="body2">
                Verifica que el período seleccionado tenga reservas registradas en el sistema.
                También puedes intentar cambiar el tipo de reporte.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
