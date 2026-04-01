"use client";

import { EventType } from "@prisma/client";
import { useMemo, useState } from "react";
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
import { MessageCircle, Bell, CalendarClock, CreditCard, DollarSign, Send } from "lucide-react";

interface WhatsAppActionsProps {
  client: {
    firstName: string;
    phone: string | null;
  };
  legalCase: {
    caratula: string;
    events?: Array<{
      date: Date | string;
      title: string;
      type: EventType;
    }>;
  };
}

export function WhatsAppActions({ client, legalCase }: WhatsAppActionsProps) {
  const [showCbuDialog, setShowCbuDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const myCbuAlias = "ESTUDIO.JURIDICO.ALIAS";
  const bankName = "Banco Santa Fe";

  const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, "") : "";
  const baseUrl = `https://wa.me/549${cleanPhone}?text=`;

  const nextEvent = legalCase.events && legalCase.events.length > 0 ? legalCase.events[0] : null;

  const msgNews = useMemo(
    () =>
      `Hola ${client.firstName}, te escribo para contarte que hubo novedades en tu expediente (${legalCase.caratula}). Cuando puedas llamame y te comento.`,
    [client.firstName, legalCase.caratula]
  );

  const msgEvent = useMemo(
    () =>
      nextEvent
        ? `Hola ${client.firstName}, te recuerdo que tenemos una cita importante:%0AFecha: ${new Date(nextEvent.date).toLocaleDateString()}%0AHora: ${new Date(nextEvent.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} hs%0AMotivo: ${nextEvent.title}.%0A%0APor favor confirmame asistencia.`
        : `Hola ${client.firstName}, necesito que nos reunamos para ver tu caso. Avisame cuando podes.`,
    [client.firstName, nextEvent]
  );

  const openWa = (msg: string) => {
    if (!cleanPhone) {
      setError("El cliente no tiene telefono cargado.");
      return;
    }

    setError(null);
    window.open(baseUrl + msg, "_blank");
  };

  const handleSendCbu = () => {
    let msg = `Hola ${client.firstName}, te paso los datos para la transferencia de honorarios:`;

    if (amount.trim() !== "") {
      msg += `%0A%0ATotal a transferir: $ ${Number(amount).toLocaleString("es-AR")}`;
    }

    msg += `%0A%0ABanco: ${bankName}%0AAlias: ${myCbuAlias}%0A%0AAvisame cuando realices el pago. Gracias!`;

    openWa(msg);
    if (!cleanPhone) return;

    setShowCbuDialog(false);
    setAmount("");
  };

  return (
    <>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-sm transition-all">
              <MessageCircle className="h-4 w-4" />
              Enviar mensaje...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 dark:bg-slate-900 dark:border-slate-800">
            <DropdownMenuLabel>Seleccionar plantilla</DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-slate-800" />

            <DropdownMenuItem onClick={() => openWa(msgNews)} className="cursor-pointer py-3 gap-2">
              <Bell className="h-4 w-4 text-blue-500" /> Avisar novedades
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => openWa(msgEvent)} className="cursor-pointer py-3 gap-2">
              <CalendarClock className="h-4 w-4 text-amber-500" /> Recordar cita/audiencia
            </DropdownMenuItem>

            <DropdownMenuSeparator className="dark:bg-slate-800" />

            <DropdownMenuItem
              onClick={() => {
                setError(null);
                setShowCbuDialog(true);
              }}
              className="cursor-pointer text-green-700 dark:text-green-400 font-bold py-3 bg-green-50 dark:bg-green-900/10 gap-2 focus:bg-green-100 dark:focus:bg-green-900/20"
            >
              <CreditCard className="h-4 w-4" /> Enviar CBU / solicitud de pago
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <Dialog open={showCbuDialog} onOpenChange={setShowCbuDialog}>
        <DialogContent className="sm:max-w-[400px] dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Solicitar pago</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="font-bold dark:text-gray-300">
                Monto a pedir (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ej: 50000"
                  className="pl-9 text-lg font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSendCbu();
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Si lo dejas vacio, solo se enviaran los datos bancarios.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCbuDialog(false)} className="dark:border-slate-700 dark:text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSendCbu} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Send className="h-4 w-4" /> Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
