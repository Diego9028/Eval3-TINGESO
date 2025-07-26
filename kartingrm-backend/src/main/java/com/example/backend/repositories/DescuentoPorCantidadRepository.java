package com.example.backend.repositories;

import com.example.backend.entities.DescuentoPorCantidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DescuentoPorCantidadRepository extends JpaRepository<DescuentoPorCantidad, Long> {
    List<DescuentoPorCantidad> findAll();
}
