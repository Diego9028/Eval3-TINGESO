package com.example.backend.repositories;

import com.example.backend.entities.Tarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TarifaRepository extends JpaRepository<Tarifa, Long> {
    Tarifa findByDuracionTotalMinutos(int duracionTotalMinutos);
    Tarifa findByNumeroVueltas(int numeroVueltas);

}
