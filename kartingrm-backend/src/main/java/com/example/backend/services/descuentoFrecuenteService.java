package com.example.backend.services;


import com.example.backend.entities.descuentoFrecuente;
import com.example.backend.repositories.descuentoFrecuenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class descuentoFrecuenteService {

    @Autowired
    private descuentoFrecuenteRepository repository;

    public int calcularDescuentoPorFrecuencia(int FrecuenciaPersonas) {
        return repository.findAll().stream()
                .filter(d -> FrecuenciaPersonas >= d.getMinVisitas() && FrecuenciaPersonas <= d.getMaxVisitas())
                .mapToInt(descuentoFrecuente::getPorcentaje)
                .findFirst()
                .orElse(0);
    }


}

