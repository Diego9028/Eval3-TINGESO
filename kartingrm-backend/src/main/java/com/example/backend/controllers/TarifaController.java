package com.example.backend.controllers;

import com.example.backend.entities.Tarifa;
import com.example.backend.services.TarifaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/tarifas")
public class TarifaController {

    @Autowired
    private TarifaService tarifaService;

    @GetMapping
    public ResponseEntity<List<Tarifa>> obtenerTodas() {
        return ResponseEntity.ok(tarifaService.obtenerTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tarifa> obtenerPorId(@PathVariable Long id) {
        Optional<Tarifa> tarifa = tarifaService.buscarPorId(id);
        return tarifa.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Tarifa> crearTarifa(@RequestBody Tarifa tarifa) {
        Tarifa nuevaTarifa = tarifaService.guardarTarifa(tarifa);
        return ResponseEntity.ok(nuevaTarifa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tarifa> actualizarTarifa(@PathVariable Long id, @RequestBody Tarifa tarifaActualizada) {
        Optional<Tarifa> existente = tarifaService.buscarPorId(id);
        if (existente.isPresent()) {
            Tarifa tarifa = existente.get();
            tarifa.setNumeroVueltas(tarifaActualizada.getNumeroVueltas());
            tarifa.setTiempoMaximoMinutos(tarifaActualizada.getTiempoMaximoMinutos());
            tarifa.setDuracionTotalMinutos(tarifaActualizada.getDuracionTotalMinutos());
            tarifa.setPrecio(tarifaActualizada.getPrecio());
            return ResponseEntity.ok(tarifaService.guardarTarifa(tarifa));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTarifa(@PathVariable Long id) {
        if (tarifaService.buscarPorId(id).isPresent()) {
            tarifaService.eliminarTarifa(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/precio")
    public int obtenerPrecio(@RequestParam int NumeroVueltas) {
        return tarifaService.obtenerPrecio(NumeroVueltas);
    }

    @GetMapping("/by-vueltas")
    public Tarifa obtenerTarifaPorVueltas(@RequestParam int numeroVueltas) {
        return tarifaService.obtenerTarifaPorVueltas(numeroVueltas);
    }

}
