"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface WhatsAppActionsProps {
  client: any;
  legalCase: any;
}

export function WhatsAppActions({ client, legalCase }: WhatsAppActionsProps) {
  const [showCbuDialog, setShowCbuDialog] = useState(false);
  const [amount, setAmount] = useState("");

  // 🏦 DATOS BANCARIOS (Configuralos acá)
  const MY_CBU_ALIAS = "ESTUDIO.JURIDICO.ALIAS"; 
  const BANK_NAME = "Banco Santa Fe";

  const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, "") : "";
  const baseUrl = `https://wa.me/549${cleanPhone}?text=`;

  // Función genérica para abrir WhatsApp
  const openWa = (msg: string) => {
    if (!cleanPhone) return alert("El cliente no tiene teléfono cargado.");
    window.open(baseUrl + msg, "_blank");
  };

  // 1. Lógica para el mensaje de CBU con monto opcional
  const handleSendCbu = () => {
    let msg = `Hola ${client.firstName}, te paso los datos para la transferencia de honorarios:`;
    
    // Si puso monto, lo agregamos bien visible
    if (amount && amount.trim() !== "") {
        msg += `%0A%0A💰 *Total a transferir: $ ${Number(amount).toLocaleString('es-AR')}*`;
    }

    msg += `%0A%0A🏦 ${BANK_NAME}%0A📎 Alias: *${MY_CBU_ALIAS}*%0A%0AAvisame cuando realices el pago. Gracias!`;
    
    openWa(msg);
    setShowCbuDialog(false); // Cerramos el dialog
    setAmount(""); // Limpiamos el campo
  };

  // 2. Plantilla de NOVEDADES
  const msgNews = `Hola ${client.firstName}, te escribo para contarte que hubo novedades en tu expediente (${legalCase.caratula}). Cuando puedas llamame y te comento.`;

  // 3. Plantilla de AUDIENCIA
  const nextEvent = legalCase.events && legalCase.events.length > 0 ? legalCase.events[0] : null;
  const msgEvent = nextEvent 
    ? `Hola ${client.firstName}, te recuerdo que tenemos una cita importante:%0A📅 ${new Date(nextEvent.date).toLocaleDateString()}%0A🕒 ${new Date(nextEvent.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs%0A📍 Motivo: ${nextEvent.title}.%0A%0APor favor confirmame asistencia.` 
    : `Hola ${client.firstName}, necesito que nos reunamos para ver tu caso. Avisame cuándo podés.`;

  return (
    <>
        {/* MENÚ DESPLEGABLE */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0 .5-.5l.14-.35A.5.5 0 0 0 10.62 8 8 0 0 0 9 6.22 8 8 0 0 0 7.38 7.5a.5.5 0 0 0 .14.65l.35.14a.5.5 0 0 0 .5-.5V7a.5.5 0 0 0-1 0v1a.5.5 0 0 0 .5.5h1z"/></svg>
            Enviar Mensaje...
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 dark:bg-slate-900 dark:border-slate-800">
            <DropdownMenuLabel>Seleccionar Plantilla</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => openWa(msgNews)} className="cursor-pointer py-3">
                👋 Avisar Novedades
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => openWa(msgEvent)} className="cursor-pointer py-3">
                📅 Recordar Cita/Audiencia
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Este botón ahora abre el Dialog en lugar de WhatsApp directo */}
            <DropdownMenuItem onClick={() => setShowCbuDialog(true)} className="cursor-pointer text-green-600 dark:text-green-400 font-bold py-3 bg-green-50 dark:bg-green-900/10">
                💸 Enviar CBU / Solicitud de Pago
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>

        {/* DIALOGO PARA PEDIR EL MONTO */}
        <Dialog open={showCbuDialog} onOpenChange={setShowCbuDialog}>
            <DialogContent className="sm:max-w-[400px] dark:bg-slate-950 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>Solicitar Pago</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="font-bold">Monto a pedir (Opcional)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Ej: 50000"
                                className="pl-7 text-lg font-bold"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') handleSendCbu() }} // Enviar con Enter
                            />
                        </div>
                        <p className="text-xs text-gray-500">Si lo dejás vacío, solo se enviarán los datos bancarios.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCbuDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSendCbu} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        Enviar WhatsApp 🚀
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}