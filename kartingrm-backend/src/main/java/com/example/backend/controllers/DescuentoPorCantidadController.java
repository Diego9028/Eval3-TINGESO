package com.example.backend.controllers;

import com.example.backend.services.DescuentoPorCantidadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/descuento-personas")
public class DescuentoPorCantidadController {

    @Autowired
    private DescuentoPorCantidadService service;

    @GetMapping
    public int obtenerDescuento(@RequestParam int cantidad) {
        return service.calcularDescuentoPorCantidad(cantidad);
    }
}
