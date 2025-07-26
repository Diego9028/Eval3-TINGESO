package com.example.backend.services;

import com.example.backend.entities.Cliente;
import com.example.backend.repositories.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public Cliente buscarPorRut(String rut) {
        return clienteRepository.findByRut(rut);
    }
    public Cliente buscarPorEmail(String email) {
        return clienteRepository.findByEmail(email);
    }
    public List<Cliente> obtenerTodos() {
        return clienteRepository.findAll();
    }

    public Cliente guardarCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public void eliminarCliente(Long id) {
        clienteRepository.deleteById(id);
    }

    public LocalDate obtenerFechaNacimiento(Long id) {
        return clienteRepository.findById(id)
                .map(Cliente::getFechaNacimiento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + id));
    }
}
