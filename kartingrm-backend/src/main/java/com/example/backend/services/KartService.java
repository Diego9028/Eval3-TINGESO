package com.example.backend.services;


import com.example.backend.entities.Kart;
import com.example.backend.repositories.KartRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KartService {

    private final KartRepository kartRepository;

    public KartService(KartRepository kartRepository) {
        this.kartRepository = kartRepository;
    }

    public List<Kart> obtenerTodos() {
        return kartRepository.findAll();
    }
}
