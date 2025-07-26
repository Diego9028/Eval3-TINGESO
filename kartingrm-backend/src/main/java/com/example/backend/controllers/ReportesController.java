package com.example.backend.controllers;

import com.example.backend.entities.Reportes;
import com.example.backend.services.ReportesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reportes")
public class ReportesController {

    @Autowired
    private ReportesService reportesService;

    // 🔹 Ingresos por número de vueltas
    @GetMapping("/vueltas")
    public List<Reportes> ingresosPorVueltas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return reportesService.generarIngresosPorVueltas(inicio, fin);
    }

    // 🔹 Ingresos por tiempo máximo
    @GetMapping("/tiempo")
    public List<Reportes> ingresosPorTiempoMaximo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return reportesService.generarIngresosPorTiempo(inicio, fin);
    }

    // 🔹 Ingresos por cantidad de personas
    @GetMapping("/personas")
    public List<Reportes> ingresosPorPersonas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return reportesService.generarIngresosPorPersonas(inicio, fin);
    }
}
