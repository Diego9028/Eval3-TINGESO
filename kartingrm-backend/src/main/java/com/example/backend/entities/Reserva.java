package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long clienteTitularId;

    private LocalDateTime fechaHoraReserva;
    private LocalDateTime fechaHoraFin;

    private int cantidadPersonas;
    private int numeroVueltas;

    private int precioBase;
    private int precioFinal;

    private String estado;

    @ElementCollection
    private List<Long> idsClientesReserva;


    @ElementCollection
    private List<Long> idsKartsReservados;

    @Transient
    private String correoTitular;

    @Transient
    private List<String> correosParticipantes;
}

