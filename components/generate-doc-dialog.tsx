"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2 } from "lucide-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

interface Props {
  client: any;
  legalCase: any;
}

// Aquí podés agregar más plantillas a futuro
const TEMPLATES = [
  { id: "escrito_generico.docx", name: "Escrito de Mero Trámite" },
  { id: "presenta_bono.docx", name: "Presenta Bono y Sellado" }, // Ejemplo
  { id: "solicita_apertura.docx", name: "Solicita Apertura a Prueba" }, // Ejemplo
];

export function GenerateDocDialog({ client, legalCase }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  const generateDocument = async () => {
    setLoading(true);
    try {
      // 1. Cargar el archivo .docx desde la carpeta public
      const response = await fetch(`/templates/${selectedTemplate}`);
      if (!response.ok) throw new Error("No se encontró la plantilla");
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      // 2. Inicializar el motor de plantillas
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 3. Definir los datos a reemplazar (Acá podés agregar todo lo que quieras)
      doc.render({
        nombre: client.firstName,
        apellido: client.lastName,
        dni: client.dni || "__________",
        domicilio: client.address || "__________",
        email: client.email || "",
        telefono: client.phone || "",
        
        caratula: legalCase.caratula,
        expediente: legalCase.code,
        juzgado: legalCase.juzgado,
        fuero: legalCase.area || "CIVIL",
        
        fecha_actual: new Date().toLocaleDateString("es-AR"),
      });

      // 4. Generar el archivo final (blob)
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 5. Descargar
      const fileName = `Escrito_${client.lastName}_${legalCase.code}.docx`;
      saveAs(out, fileName);
      
      setOpen(false);
    } catch (error) {
      console.error("Error al generar documento:", error);
      alert("Hubo un error al generar el documento. Verificá que la plantilla exista en /public/templates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-700 dark:text-gray-300">
          <FileText className="h-3.5 w-3.5 text-indigo-500" /> Generar Escrito
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px] dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" /> Generador de Escritos
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="dark:text-gray-300">Seleccionar Modelo</Label>
            <Select 
                value={selectedTemplate} 
                onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-950 dark:border-slate-800">
                {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs text-slate-500 border dark:border-slate-800">
            <p className="font-bold mb-1">Datos que se completarán:</p>
            <ul className="list-disc pl-4 space-y-0.5">
                <li>Cliente: {client.lastName}, {client.firstName}</li>
                <li>Expediente: {legalCase.code}</li>
                <li>Juzgado: {legalCase.juzgado}</li>
            </ul>
          </div>

          <Button 
            onClick={generateDocument} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
          >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generando...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" /> Descargar Word (.docx)
                </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}