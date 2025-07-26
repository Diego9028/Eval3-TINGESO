package com.example.backend.services;

import com.example.backend.entities.*;
import com.example.backend.repositories.ComprobanteRepository;
import com.example.backend.repositories.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private TarifaService tarifaService;

    @Autowired
    private TarifaEspService tarifaEspService;

    @Autowired
    private KartService kartService;

    @Autowired
    private DescuentoPorCantidadService descuentoPorCantidadService;

    @Autowired
    private descuentoFrecuenteService descuentoFrecuenteService;

    @Autowired
    private ComprobanteRepository comprobanteRepository;

    @Autowired
    private ComprobanteService comprobanteService;

    public Reserva crearReserva(Reserva nuevaReserva) {
        Long titularId = obtenerClienteIdPorCorreo(nuevaReserva.getCorreoTitular());

        List<Long> idsParticipantes = nuevaReserva.getCorreosParticipantes().stream()
                .map(this::obtenerClienteIdPorCorreo)
                .toList();

        nuevaReserva.setClienteTitularId(titularId);
        nuevaReserva.setIdsClientesReserva(idsParticipantes);
        nuevaReserva.setCantidadPersonas(idsParticipantes.size());

        int reservasEsteMes = obtenerReservasDelMes(titularId, nuevaReserva.getFechaHoraReserva());

        int precioBase = obtenerPrecioBase(nuevaReserva.getNumeroVueltas());

        int descuentoEspecial = obtenerDescuentoEspecial(titularId, nuevaReserva.getFechaHoraReserva().toLocalDate());
        int descuentoPorCantidad = obtenerDescuentoPorCantidad(nuevaReserva.getCantidadPersonas());
        int descuentoPorFrecuencia = obtenerDescuentoPorFrecuencia(reservasEsteMes);

        int mejorDescuento = Math.max(descuentoEspecial, Math.max(descuentoPorCantidad, descuentoPorFrecuencia));
        int totalBase = precioBase * nuevaReserva.getCantidadPersonas();
        int precioConDescuento = totalBase - (totalBase * mejorDescuento / 100);
        int precioConIva = (int) Math.round(precioConDescuento * 1.19);

        nuevaReserva.setPrecioBase(precioBase);
        nuevaReserva.setPrecioFinal(precioConIva);

        LocalDateTime inicio = nuevaReserva.getFechaHoraReserva();
        LocalDateTime fin = calcularHoraFin(nuevaReserva.getNumeroVueltas(), inicio);
        nuevaReserva.setFechaHoraFin(fin);

        List<Reserva> reservasSolapadas = reservaRepository.findReservasSolapadas(inicio, fin);
        List<Long> idsOcupados = reservasSolapadas.stream()
                .flatMap(r -> r.getIdsKartsReservados().stream())
                .distinct()
                .toList();

        List<Kart> todosKarts = kartService.obtenerTodos();
        List<Kart> kartsDisponibles = todosKarts.stream()
                .filter(k -> !idsOcupados.contains(k.getId()))
                .toList();

        if (kartsDisponibles.size() < nuevaReserva.getCantidadPersonas()) {
            throw new IllegalStateException("No hay suficientes karts disponibles para esta reserva.");
        }

        List<Long> idsAsignados = kartsDisponibles.subList(0, nuevaReserva.getCantidadPersonas()).stream()
                .map(Kart::getId)
                .toList();

        nuevaReserva.setIdsKartsReservados(idsAsignados);
        nuevaReserva.setEstado("CONFIRMADA");

        Reserva reservaGuardada = reservaRepository.save(nuevaReserva);
        crearComprobante(reservaGuardada, mejorDescuento);
        return reservaGuardada;
    }

    public List<Reserva> obtenerTodas() {
        return reservaRepository.findAll();
    }

    private LocalDateTime calcularHoraFin(int numeroVueltas, LocalDateTime inicio) {
        Tarifa tarifa = tarifaService.obtenerTarifaPorVueltas(numeroVueltas);
        if (tarifa != null) {
            return inicio.plusMinutes(tarifa.getDuracionTotalMinutos());
        } else {
            throw new IllegalStateException("No se pudo obtener la duración desde tarifa.");
        }
    }

    private int obtenerPrecioBase(int numeroVueltas) {
        return tarifaService.obtenerPrecio(numeroVueltas);
    }

    private Long obtenerClienteIdPorCorreo(String correo) {
        Cliente cliente = clienteService.buscarPorEmail(correo);
        if (cliente != null) {
            return cliente.getId();
        } else {
            throw new IllegalArgumentException("Cliente no encontrado con correo: " + correo);
        }
    }

    private int obtenerDescuentoEspecial(Long clienteId, LocalDate fecha) {
        try {
            return tarifaEspService.obtenerDescuento(clienteId, fecha);
        } catch (Exception e) {
            return 0;
        }
    }

    private int obtenerDescuentoPorCantidad(int cantidad) {
        return descuentoPorCantidadService.calcularDescuentoPorCantidad(cantidad);
    }

    private int obtenerDescuentoPorFrecuencia(int frecuencia) {
        return descuentoFrecuenteService.calcularDescuentoPorFrecuencia(frecuencia);
    }

    private int obtenerReservasDelMes(Long clienteId, LocalDateTime fecha) {
        LocalDateTime inicioMes = fecha.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finMes = inicioMes.plusMonths(1).minusNanos(1);
        return reservaRepository.contarReservasPorMes(clienteId, inicioMes, finMes);
    }

    public Comprobante crearComprobante(Reserva reserva, int mejorDescuento) {
        String nombreTitular = obtenerNombrePorId(reserva.getClienteTitularId());
        List<String> nombresParticipantes = reserva.getIdsClientesReserva().stream()
                .map(this::obtenerNombrePorId)
                .toList();

        int tarifaBasePorPersona = reserva.getPrecioBase();
        int tarifaBase = tarifaBasePorPersona * reserva.getCantidadPersonas();
        int subtotal = tarifaBase - (tarifaBase * mejorDescuento / 100);
        int iva = (int) Math.round(subtotal * 0.19);
        int total = subtotal + iva;

        Comprobante comprobante = new Comprobante();
        comprobante.setReserva(reserva);
        comprobante.setNombreTitular(nombreTitular);
        comprobante.setNombresParticipantes(nombresParticipantes);
        comprobante.setTarifaBase(tarifaBase);
        comprobante.setDescuentoAplicado(mejorDescuento);
        comprobante.setSubtotal(subtotal);
        comprobante.setIva(iva);
        comprobante.setTotal(total);

        comprobante = comprobanteRepository.save(comprobante);

        try {
            comprobanteService.enviarComprobantePorEmail(comprobante);
        } catch (Exception e) {
            System.err.println("Error al enviar comprobante por correo: " + e.getMessage());
        }

        return comprobante;
    }

    private String obtenerNombrePorId(Long clienteId) {
        return clienteService.buscarPorId(clienteId)
                .map(Cliente::getNombre)
                .orElse("Desconocido");
    }

    public List<Reserva> obtenerReservasEntreFechas(LocalDateTime inicio, LocalDateTime fin) {
        return reservaRepository.findByFechaHoraReservaBetween(inicio, fin);
    }

    public Optional<Reserva> obtenerPorId(Long id) {
        return reservaRepository.findById(id);
    }

    public int obtenerReservasDelMesFront(Long clienteId, LocalDateTime fecha) {
        LocalDateTime inicioMes = fecha.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finMes = inicioMes.plusMonths(1).minusNanos(1);
        return reservaRepository.contarReservasPorMes(clienteId, inicioMes, finMes);
    }

}

