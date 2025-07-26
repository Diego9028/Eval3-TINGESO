package com.example.backend.repositories;

import com.example.backend.entities.Comprobante;
import com.example.backend.entities.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {
    Optional<Comprobante> findByReserva(Reserva reserva);

}
