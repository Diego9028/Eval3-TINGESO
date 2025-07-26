package com.example.backend.controllers;

import com.example.backend.services.RackSemanalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/rack-semanal")
public class RackSemanalController {

    @Autowired
    private RackSemanalService rackSemanaService;

    // 🔹 Consultar reservas por semana del año
    @GetMapping
    public List<Map<String, Object>> obtenerReservasPorSemana(
            @RequestParam int anio,
            @RequestParam int semana
    ) {
        return rackSemanaService.obtenerReservasDeSemana(anio, semana);
    }


    // 🔹 Eliminar referencia a una reserva que fue eliminada en otro microservicio
    @DeleteMapping("/remover-reserva/{reservaId}")
    public void removerReservaDeRacks(@PathVariable Long reservaId) {
        rackSemanaService.removerReservaDeTodosLosRacks(reservaId);
    }
}
