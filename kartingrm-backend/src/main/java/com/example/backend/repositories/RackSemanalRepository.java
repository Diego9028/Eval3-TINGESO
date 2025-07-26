package com.example.backend.repositories;

import com.example.backend.entities.RackSemanal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RackSemanalRepository extends JpaRepository<RackSemanal, Long> {
    Optional<RackSemanal> findByAnioAndNumeroSemana(int anio, int numeroSemana);
}