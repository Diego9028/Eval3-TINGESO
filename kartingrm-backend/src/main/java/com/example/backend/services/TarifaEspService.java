package com.example.backend.services;

import com.example.backend.entities.TarifaEsp;
import com.example.backend.repositories.TarifaEspRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Map;

@Service
public class TarifaEspService {
    @Autowired
    private TarifaEspRepository tarifaEspRepository;

    @Autowired
    private ClienteService clienteService;


    public int obtenerDescuento(Long clienteId, LocalDate fecha) {
        // 1. Cumpleaños
        int dCumple = 0;
        try {
            LocalDate fechaNacimiento = clienteService.obtenerFechaNacimiento(clienteId);
            if (fecha.getDayOfMonth() == fechaNacimiento.getDayOfMonth() &&
                    fecha.getMonth() == fechaNacimiento.getMonth()) {
                dCumple = 50;
            }
        } catch (RuntimeException e) {
            // Cliente no encontrado, dCumple se mantiene en 0
        }

        // 2. Fin de semana
        int dFinde = (fecha.getDayOfWeek() == DayOfWeek.SATURDAY ||
                fecha.getDayOfWeek() == DayOfWeek.SUNDAY) ? 10 : 0;

        // 3. Fecha especial (feriado)
        TarifaEsp fechaEspecial = tarifaEspRepository.findByFechaEspecial(fecha);
        int dFeriado = (fechaEspecial != null) ? 20 : 0;

        // 4. Mayor descuento aplica
        return Math.max(dCumple, Math.max(dFinde, dFeriado));
    }


}
