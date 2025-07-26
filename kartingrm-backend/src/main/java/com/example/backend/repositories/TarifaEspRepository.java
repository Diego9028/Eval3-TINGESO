package com.example.backend.repositories;


import com.example.backend.entities.TarifaEsp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface TarifaEspRepository extends JpaRepository<TarifaEsp, Long> {
    TarifaEsp findByFechaEspecial(LocalDate fechaEspecial);
}
