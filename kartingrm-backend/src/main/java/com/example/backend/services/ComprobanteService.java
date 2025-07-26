package com.example.backend.services;

import com.example.backend.entities.Comprobante;
import com.example.backend.entities.Reserva;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import jakarta.mail.internet.MimeMessage;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class ComprobanteService {

    @Autowired
    private JavaMailSender mailSender;

    private static final DateTimeFormatter FORMAT_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMAT_HORA = DateTimeFormatter.ofPattern("HH:mm");

    public byte[] generarPdf(Comprobante comprobante) throws Exception {
        Document doc = new Document();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, baos);
        doc.open();

        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Reserva reserva = comprobante.getReserva();

        String fechaFormato = reserva.getFechaHoraReserva().toLocalDate().format(FORMAT_FECHA);
        String horaInicio = reserva.getFechaHoraReserva().toLocalTime().format(FORMAT_HORA);
        String horaFin = reserva.getFechaHoraFin().toLocalTime().format(FORMAT_HORA);

        doc.add(new Paragraph("Comprobante de Reserva", titleFont));
        doc.add(new Paragraph("Reserva #" + reserva.getId()));
        doc.add(new Paragraph("Fecha: " + fechaFormato));
        doc.add(new Paragraph("Horario: " + horaInicio + " - " + horaFin));
        doc.add(new Paragraph("Titular: " + comprobante.getNombreTitular()));
        doc.add(new Paragraph("Participantes: " + String.join(", ", comprobante.getNombresParticipantes())));
        doc.add(new Paragraph("Cantidad de personas: " + reserva.getCantidadPersonas()));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        Stream.of("Tarifa base", "Descuento aplicado (%)", "Subtotal", "IVA", "Total")
                .forEach(col -> table.addCell(new PdfPCell(new Phrase(col))));

        table.addCell(String.valueOf(comprobante.getTarifaBase()));
        table.addCell(String.valueOf(comprobante.getDescuentoAplicado()));
        table.addCell(String.valueOf(comprobante.getSubtotal()));
        table.addCell(String.valueOf(comprobante.getIva()));
        table.addCell(String.valueOf(comprobante.getTotal()));

        doc.add(table);

        doc.add(new Paragraph(" "));
        doc.add(new Paragraph("Gracias por reservar con nosotros.",
                FontFactory.getFont(FontFactory.HELVETICA, 12)));

        doc.close();
        return baos.toByteArray();
    }

    public byte[] generarExcel(Comprobante comprobante) throws Exception {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Comprobante");

        Row header = sheet.createRow(0);
        String[] columnas = {"Tarifa Base", "Descuento (%)", "Subtotal", "IVA", "Total"};
        for (int i = 0; i < columnas.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(columnas[i]);
        }

        Row row = sheet.createRow(1);
        row.createCell(0).setCellValue(comprobante.getTarifaBase());
        row.createCell(1).setCellValue(comprobante.getDescuentoAplicado());
        row.createCell(2).setCellValue(comprobante.getSubtotal());
        row.createCell(3).setCellValue(comprobante.getIva());
        row.createCell(4).setCellValue(comprobante.getTotal());

        for (int i = 0; i < columnas.length; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        workbook.close();
        return baos.toByteArray();
    }

    public void enviarComprobantePorEmail(Comprobante comprobante) throws Exception {
        byte[] pdf = generarPdf(comprobante);
        Reserva reserva = comprobante.getReserva();

        Set<String> correos = new HashSet<>();
        correos.add(reserva.getCorreoTitular());
        correos.addAll(reserva.getCorreosParticipantes());

        for (String email : correos) {
            enviarCorreo(email, pdf, reserva.getId());
        }

    }

    private void enviarCorreo(String destinatario, byte[] pdf, Long reservaId) throws Exception {
        MimeMessage mensaje = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensaje, true);

        helper.setTo(destinatario);
        helper.setSubject("Tu comprobante de reserva - KartingRM");
        helper.setText("Adjuntamos el comprobante de tu reserva en PDF y Excel. ¡Gracias por preferirnos!");

        helper.addAttachment("comprobante_" + reservaId + ".pdf", new ByteArrayResource(pdf));

        mailSender.send(mensaje);
    }


}
