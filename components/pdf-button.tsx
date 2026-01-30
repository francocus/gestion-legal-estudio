"use client";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

interface PdfButtonProps {
  client: any;
  legalCase: any;
  stats: {
    totalIncome: number;
    totalFee: number;
    balance: number;
  };
}

export function PdfButton({ client, legalCase, stats }: PdfButtonProps) {
  
  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // --- ENCABEZADO ---
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Estudio Juridico Digital", margin, y); // Sin tildes por las dudas en el header
    
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, y);
    y += 10;

    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Ficha de Expediente", margin, y);
    y += 15;

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 10;

    // --- 1. DATOS DEL CLIENTE ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 200);
    doc.text("Datos del Cliente", margin, y); // 👈 SAQUÉ EL EMOJI 👤
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Nombre: ${client.lastName}, ${client.firstName}`, margin, y);
    y += 7;
    doc.text(`DNI: ${client.dni || "---"}`, margin, y);
    y += 7;
    doc.text(`Telefono: ${client.phone || "---"}`, margin, y);
    y += 7;
    doc.text(`Email: ${client.email || "---"}`, margin, y);
    y += 7;
    doc.text(`Domicilio: ${client.address || "---"}`, margin, y);
    y += 15;

    // --- 2. DATOS DEL EXPEDIENTE ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 200);
    doc.text("Informacion del Caso", margin, y); // 👈 SAQUÉ EL EMOJI 📂
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");

    const caratulaLines = doc.splitTextToSize(`Caratula: ${legalCase.caratula}`, 170);
    doc.text(caratulaLines, margin, y);
    y += (caratulaLines.length * 7);

    doc.text(`Expediente Nro: ${legalCase.code}`, margin, y);
    y += 7;
    doc.text(`Radicacion: ${legalCase.juzgado}`, margin, y);
    y += 7;
    doc.text(`Fuero: ${legalCase.area || "CIVIL"}`, margin, y);
    y += 7;
    
    const statusMap: any = { ACTIVE: "En Tramite", MEDIATION: "Mediacion", ARCHIVED: "Archivado" };
    doc.text(`Estado: ${statusMap[legalCase.status] || legalCase.status}`, margin, y);
    y += 15;

    // --- 3. RESUMEN FINANCIERO ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 150, 100);
    doc.text("Estado de Cuenta", margin, y); // 👈 SAQUÉ EL EMOJI 💰
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");

    doc.text(`Honorarios Pactados: $ ${stats.totalFee.toLocaleString("es-AR")}`, margin, y);
    y += 7;
    doc.text(`Total Abonado: $ ${stats.totalIncome.toLocaleString("es-AR")}`, margin, y);
    y += 7;
    
    const debt = stats.totalFee - stats.totalIncome;
    if (debt > 0) {
        doc.setTextColor(200, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`Resta Pagar (Deuda): $ ${debt.toLocaleString("es-AR")}`, margin, y);
    } else {
        doc.setTextColor(0, 150, 0);
        doc.text(`Estado: AL DIA (Pagado Total)`, margin, y);
    }

    // --- NOTAS ---
    if (legalCase.description) {
        y += 20;
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Notas / Observaciones:", margin, y); // 👈 SAQUÉ EL EMOJI 📝
        y += 7;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80);
        const descLines = doc.splitTextToSize(legalCase.description, 170);
        doc.text(descLines, margin, y);
    }

    doc.save(`Ficha_${client.lastName}_${legalCase.code}.pdf`);
  };

  return (
    <Button 
        variant="outline" 
        size="sm" 
        onClick={generatePDF}
        className="gap-2 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-300"
    >
      📄 Descargar Ficha PDF
    </Button>
  );
}