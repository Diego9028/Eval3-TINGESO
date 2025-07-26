package com.example.backend.controllers;

import com.example.backend.services.TarifaEspService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/tarifa-especial")
public class TarifaEspController {

    @Autowired
    private TarifaEspService service;

    @GetMapping("/descuento")
    public int obtenerDescuento(
            @RequestParam Long clienteId,
            @RequestParam String fecha // formato: yyyy-MM-dd
    ) {
        return service.obtenerDescuento(clienteId, LocalDate.parse(fecha));
    }

}
