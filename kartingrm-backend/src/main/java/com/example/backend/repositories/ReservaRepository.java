package com.example.backend.repositories;


import com.example.backend.entities.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("SELECT r FROM Reserva r WHERE r.fechaHoraReserva < :fin AND r.fechaHoraFin > :inicio")
    List<Reserva> findReservasSolapadas(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.clienteTitularId = :clienteId " +
            "AND r.fechaHoraReserva BETWEEN :inicio AND :fin")
    int contarReservasPorMes(@Param("clienteId") Long clienteId,
                             @Param("inicio") LocalDateTime inicio,
                             @Param("fin") LocalDateTime fin);
    List<Reserva> findByFechaHoraReservaBetween(LocalDateTime inicio, LocalDateTime fin);

}
