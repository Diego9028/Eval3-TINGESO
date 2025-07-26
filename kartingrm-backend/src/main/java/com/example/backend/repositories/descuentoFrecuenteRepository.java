package com.example.backend.repositories;

import com.example.backend.entities.descuentoFrecuente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface descuentoFrecuenteRepository extends JpaRepository<descuentoFrecuente, Long> {
    List<descuentoFrecuente> findAll();
}
