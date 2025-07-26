package com.example.backend.services;

import com.example.backend.entities.Reportes;
import com.example.backend.entities.Reserva;
import com.example.backend.repositories.ReportesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportesService {

    @Autowired
    private ReportesRepository reportesRepo;

    @Autowired
    private ReservaService reservaService;

    public List<Reportes> generarIngresosPorVueltas(LocalDateTime inicio, LocalDateTime fin) {
        List<Map<String, Object>> reservas = obtenerReservas(inicio, fin);
        Map<Integer, Long> acumulados = new HashMap<>();

        for (Map<String, Object> r : reservas) {
            int vueltas = (int) r.get("numeroVueltas");
            int total = (int) r.get("precioFinal");
            acumulados.merge(vueltas, (long) total, Long::sum);
        }

        List<Reportes> resultado = acumulados.entrySet().stream()
                .map(e -> Reportes.builder()
                        .tipo("INGRESOS_VUELTAS")
                        .criterio(e.getKey() + " vueltas")
                        .totalIngresos(e.getValue())
                        .fechaGeneracion(LocalDateTime.now())
                        .build())
                .toList();

        return reportesRepo.saveAll(resultado);
    }

    public List<Reportes> generarIngresosPorPersonas(LocalDateTime inicio, LocalDateTime fin) {
        List<Map<String, Object>> reservas = obtenerReservas(inicio, fin);
        Map<String, Long> acumulados = new HashMap<>();

        for (Map<String, Object> r : reservas) {
            int cantidad = (int) r.get("cantidadPersonas");
            int total = (int) r.get("precioFinal");
            String rango = rangoPersonas(cantidad);
            acumulados.merge(rango, (long) total, Long::sum);
        }

        List<Reportes> resultado = acumulados.entrySet().stream()
                .map(e -> Reportes.builder()
                        .tipo("INGRESOS_PERSONAS")
                        .criterio(e.getKey())
                        .totalIngresos(e.getValue())
                        .fechaGeneracion(LocalDateTime.now())
                        .build())
                .toList();

        return reportesRepo.saveAll(resultado);
    }

    public List<Reportes> generarIngresosPorTiempo(LocalDateTime inicio, LocalDateTime fin) {
        List<Reportes> porVueltas = generarIngresosPorVueltas(inicio, fin);

        porVueltas.forEach(r -> {
            r.setTipo("INGRESOS_TIEMPO");
            String criterio = r.getCriterio(); // "10 vueltas"
            r.setCriterio(criterio.replace("vueltas", "minutos"));
        });

        return reportesRepo.saveAll(porVueltas);
    }

    private List<Map<String, Object>> obtenerReservas(LocalDateTime inicio, LocalDateTime fin) {
        List<Reserva> reservas = reservaService.obtenerReservasEntreFechas(inicio, fin);

        // Convertir cada reserva a un Map (puedes ajustar los campos según tus necesidades)
        return reservas.stream()
                .map(r -> Map.of(
                        "id", (Object) r.getId(),
                        "clienteTitularId", (Object) r.getClienteTitularId(),
                        "numeroVueltas", (Object) r.getNumeroVueltas(),
                        "fechaHoraReserva", (Object) r.getFechaHoraReserva(),
                        "fechaHoraFin", (Object) r.getFechaHoraFin(),
                        "precioFinal", (Object) r.getPrecioFinal(),
                        "cantidadPersonas", r.getCantidadPersonas(),
                        "estado", (Object) r.getEstado()
                ))
                .toList();
    }

    private String rangoPersonas(int n) {
        if (n <= 2) return "1-2 personas";
        if (n <= 5) return "3-5 personas";
        if (n <= 10) return "6-10 personas";
        return "11-15 personas";
    }
}
