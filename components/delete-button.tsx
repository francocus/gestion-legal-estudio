"use client";

import { Button } from "@/components/ui/button";
import { 
  deleteClient, 
  deleteCase, 
  deleteEvent, 
  deleteTransaction, 
  deleteMovement 
} from "@/app/actions";

interface Props {
  id: string;
  type: "CLIENT" | "CASE" | "EVENT" | "TRANSACTION" | "MOVEMENT";
  clientId?: string;
  caseId?: string; // Nuevo: necesario para volver al expediente correcto
}

export function DeleteButton({ id, type, clientId, caseId }: Props) {
  
  // Diccionario de funciones según el tipo
  const actions = {
    CLIENT: deleteClient,
    CASE: deleteCase,
    EVENT: deleteEvent,
    TRANSACTION: deleteTransaction,
    MOVEMENT: deleteMovement,
  };

  const action = actions[type];

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      {caseId && <input type="hidden" name="caseId" value={caseId} />}
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-6 w-6" // Hice el botón un poco más chico (h-6)
        title="Eliminar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </Button>
    </form>
  );
}