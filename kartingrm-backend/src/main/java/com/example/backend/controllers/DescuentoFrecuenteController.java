package com.example.backend.controllers;

import com.example.backend.services.descuentoFrecuenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/descuento-frecuencia")
public class DescuentoFrecuenteController {

    @Autowired
    private descuentoFrecuenteService service;

    @GetMapping
    public int obtenerDescuento(@RequestParam int Frecuencia) {
        return service.calcularDescuentoPorFrecuencia(Frecuencia);
    }
}
