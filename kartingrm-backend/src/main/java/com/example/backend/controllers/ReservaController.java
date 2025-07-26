package com.example.backend.controllers;

import com.example.backend.entities.Reserva;
import com.example.backend.repositories.ComprobanteRepository;
import com.example.backend.repositories.ReservaRepository;
import com.example.backend.services.RackSemanalService;
import com.example.backend.services.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private RackSemanalService rackSemanalService;

    @Autowired
    private ComprobanteRepository comprobanteRepository;


    @PostMapping("/crear")
    public Reserva crearReserva(@RequestBody Reserva reserva) {
        return reservaService.crearReserva(reserva);
    }

    @GetMapping("/todas")
    public List<Reserva> obtenerReservas() {
        return reservaService.obtenerTodas();
    }

    @GetMapping("/por-fecha")
    public List<Reserva> obtenerPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return reservaRepository.findByFechaHoraReservaBetween(inicio, fin);
    }

    @GetMapping("/{id}")
    public Map<String, Object> obtenerReservaPorId(@PathVariable Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        Map<String, Object> map = new HashMap<>();
        map.put("id", reserva.getId());
        map.put("cantidadPersonas", reserva.getCantidadPersonas());
        map.put("numeroVueltas", reserva.getNumeroVueltas());
        map.put("precioFinal", reserva.getPrecioFinal());
        map.put("fechaHoraReserva", reserva.getFechaHoraReserva().toString());
        map.put("idClienteTitular", reserva.getClienteTitularId());
        return map;
    }

    @DeleteMapping("/eliminar/{reservaId}")
    public ResponseEntity<Void> eliminarReserva(@PathVariable Long reservaId) {
        Optional<Reserva> reservaOpt = reservaRepository.findById(reservaId);
        if (reservaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Reserva reserva = reservaOpt.get();

        // Eliminar comprobante asociado si existe
        comprobanteRepository.findByReserva(reserva).ifPresent(comprobanteRepository::delete);

        // Eliminar reserva
        reservaRepository.deleteById(reservaId);

        // Actualizar racks
        try {
            rackSemanalService.removerReservaDeTodosLosRacks(reservaId);
        } catch (Exception e) {
            System.err.println("Error actualizando RackSemanal: " + e.getMessage());
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/frecuencia-mensual")
    public Map<String, Object> obtenerReservasDelMes(
            @RequestParam Long clienteId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        // Convertir LocalDate a LocalDateTime con hora mínima para reutilizar el método
        int cantidad = reservaService.obtenerReservasDelMesFront(clienteId, fecha.atStartOfDay());
        return Map.of("cantidadReservas", cantidad);
    }




}
