package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RackSemanal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int anio;

    private int numeroSemana;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @ElementCollection
    private List<Long> idsReservas;
}
