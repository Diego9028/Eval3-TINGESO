package com.example.backend.services;

import com.example.backend.entities.Tarifa;
import com.example.backend.repositories.TarifaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TarifaService {

    @Autowired
    private TarifaRepository tarifaRepository;

    public List<Tarifa> obtenerTodas() {
        return tarifaRepository.findAll();
    }

    public Optional<Tarifa> buscarPorId(Long id) {
        return tarifaRepository.findById(id);
    }

    public Tarifa guardarTarifa(Tarifa tarifa) {
        return tarifaRepository.save(tarifa);
    }

    public void eliminarTarifa(Long id) {
        tarifaRepository.deleteById(id);
    }

    public int obtenerPrecio(int NumeroVueltas) {
        Tarifa tarifa = tarifaRepository.findByNumeroVueltas(NumeroVueltas);
        if (tarifa == null) {
            throw new IllegalArgumentException("No se encontró una tarifa con num vueltas total de " + NumeroVueltas);
        }

        double precioConIva = tarifa.getPrecio();
        return (int) Math.round(precioConIva);
    }

    public Tarifa obtenerTarifaPorVueltas(int numeroVueltas) {
        return tarifaRepository.findByNumeroVueltas(numeroVueltas);
    }

}
