package com.example.backend.repositories;

import com.example.backend.entities.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    public Cliente findByRut(String rut);
    public Cliente findByEmail(String email);

}
