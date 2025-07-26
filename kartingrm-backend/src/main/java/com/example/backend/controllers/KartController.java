package com.example.backend.controllers;

import com.example.backend.entities.Kart;
import com.example.backend.services.KartService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/karts")
public class KartController {

    private final KartService kartService;

    public KartController(KartService kartService) {
        this.kartService = kartService;
    }

    @GetMapping
    public List<Kart> obtenerKarts() {
        return kartService.obtenerTodos();
    }
}
