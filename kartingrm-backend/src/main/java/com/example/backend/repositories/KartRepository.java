package com.example.backend.repositories;

import com.example.backend.entities.Kart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KartRepository extends JpaRepository<Kart, Long> {
}
