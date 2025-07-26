package com.example.backend.services;


import com.example.backend.entities.RackSemanal;
import com.example.backend.entities.Reserva;
import com.example.backend.repositories.RackSemanalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.stream.Collectors;

@Service
public class RackSemanalService {

    @Autowired
    private RackSemanalRepository repository;

    @Autowired
    private ReservaService reservaService;

    public List<Map<String, Object>> obtenerReservasDeSemana(int anio, int semana) {
        // Calcular inicio y fin de semana ISO
        LocalDate inicio = LocalDate.of(anio, 1, 1)
                .with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, semana)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate fin = inicio.plusDays(6);

        List<Reserva> reservas = reservaService.obtenerReservasEntreFechas(inicio.atStartOfDay(), fin.atTime(23, 59, 59));

        // Convertir reservas a mapas simples (puedes personalizar esto si prefieres un DTO)
        List<Map<String, Object>> reservasMapeadas = reservas.stream()
                .map(r -> {
                    Map<String, Object> reservaMap = new HashMap<>();
                    reservaMap.put("id", r.getId());
                    reservaMap.put("clienteTitularId", r.getClienteTitularId());
                    reservaMap.put("numeroVueltas", r.getNumeroVueltas());
                    reservaMap.put("fechaHoraReserva", r.getFechaHoraReserva());
                    reservaMap.put("fechaHoraFin", r.getFechaHoraFin());
                    reservaMap.put("precioFinal", r.getPrecioFinal());
                    reservaMap.put("estado", r.getEstado());
                    return reservaMap;
                })
                .collect(Collectors.toList()); // ✅ mutable

        List<Long> ids = reservas.stream()
                .map(Reserva::getId)
                .collect(Collectors.toCollection(ArrayList::new)); // ✅ mutable

        RackSemanal rack = repository.findByAnioAndNumeroSemana(anio, semana)
                .orElse(new RackSemanal(null, anio, semana, inicio, fin, new ArrayList<>()));

        rack.setIdsReservas(ids); // ahora es mutable, no lanza error
        repository.save(rack);

        return reservasMapeadas;
    }


    public void removerReservaDeTodosLosRacks(Long reservaId) {
        List<RackSemanal> racks = repository.findAll();

        for (RackSemanal rack : racks) {
            if (rack.getIdsReservas().contains(reservaId)) {
                rack.getIdsReservas().remove(reservaId);
                repository.save(rack);
            }
        }
    }
}


