"use server"; // 👈 Obligatorio para que corra en el servidor

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
  // Función auxiliar para limpiar campos vacíos
  // Función auxiliar mejorada
  const getVal = (key: string) => {
    const val = formData.get(key) as string;
    // Si está vacío O si el usuario eligió la opción de "borrar"
    if (!val || val === "EMPTY_SELECTION") return null; 
    return val;
  };

  // Identificación
  const docType = formData.get("docType") as string; // Siempre viene algo porque es Select
  const dni = getVal("dni");
  const cuit = getVal("cuit");

  // Personales
  const gender = getVal("gender");
  const nationality = getVal("nationality");
  const birthPlace = getVal("birthPlace");
  const occupation = getVal("occupation");
  const civilStatus = getVal("civilStatus");
  
  // Fecha: Si viene string, la convertimos a Date (Objeto Fecha real)
  const rawDate = formData.get("birthDate") as string;
  // Le agregamos "T12:00:00" para fijarlo al mediodía y evitar el cambio de día por zona horaria
const birthDate = rawDate ? new Date(rawDate + "T12:00:00") : null;

  // Ubicación y Contacto
  const address = getVal("address");
  const location = getVal("location");
  const phone = getVal("phone");
  const email = getVal("email");
  const familyPhone = getVal("familyPhone");

  if (!firstName || !lastName) return;

  await db.client.create({
    data: {
      firstName, lastName, 
      docType, dni, cuit,
      gender, birthDate, birthPlace, nationality, occupation, civilStatus,
      address, location, phone, email, familyPhone
    },
  });

  revalidatePath("/");
}

export async function createCase(formData: FormData) {
  console.log("1. --- INICIANDO CREACIÓN DE CASO ---");
  
  const clientId = formData.get("clientId") as string;
  const caratula = formData.get("caratula") as string;
  const code = formData.get("code") as string;
  const juzgado = formData.get("juzgado") as string;
  
  // Imprimimos los datos para ver si llegan bien
  console.log("Datos recibidos:", { clientId, caratula, code, juzgado });

  // Verificamos si falta algo
  if (!clientId) {
    console.log("❌ ERROR: Falta el ID del Cliente");
    return;
  }
  if (!caratula) {
    console.log("❌ ERROR: Falta la Carátula");
    return;
  }
  
  console.log("2. Intentando guardar en base de datos...");

  try {
    await db.case.create({
      data: {
        caratula,
        code,
        juzgado,
        description: formData.get("description") as string,
        clientId, 
      },
    });
    console.log("✅ ¡ÉXITO! Guardado en DB.");
    
    // Esto es clave: refrescar la pantalla
    revalidatePath(`/client/${clientId}`);
    console.log("3. Pantalla actualizada.");
    
  } catch (error) {
    console.log("🔥 ERROR CRÍTICO AL GUARDAR:", error);
  }
}

// ... (tus otras funciones arriba)

export async function createMovement(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string; // Necesario para refrescar la pantalla correcta
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;

  if (!caseId || !title || !dateStr) return;

  await db.movement.create({
    data: {
      caseId,
      title,
      description,
      date: new Date(dateStr), // Convertimos el texto "2026-01-29" a fecha real
    },
  });

  // Refrescamos la página del expediente
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

// ... (tus otras funciones)

export async function createEvent(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string; // Para refrescar la pantalla
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as "HEARING" | "DEADLINE" | "MEETING";

  if (!caseId || !title || !dateStr || !type) return;

  await db.event.create({
    data: {
      caseId,
      title,
      description,
      type,
      date: new Date(dateStr), // Guarda la fecha futura
      isDone: false, // Nace pendiente
    },
  });

  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function createTransaction(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string); // Convertimos texto a número
  const type = formData.get("type") as string; // "INCOME" o "EXPENSE"

  if (!caseId || !amount || !type) return;

  await db.transaction.create({
    data: {
      caseId,
      description,
      amount,
      type,
    },
  });

  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

// ... tus otras funciones

export async function deleteClient(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  await db.client.delete({ where: { id } });
  
  // Refrescamos el tablero
  revalidatePath("/");
}

export async function deleteCase(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string; // Para volver a la carpeta correcta
  
  if (!id) return;

  await db.case.delete({ where: { id } });

  // Refrescamos la carpeta del cliente
  revalidatePath(`/client/${clientId}`);
}

// ... (tus otras funciones deleteClient y deleteCase)

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const caseId = formData.get("caseId") as string;
  
  if (!id) return;
  await db.event.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function deleteTransaction(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const caseId = formData.get("caseId") as string;

  if (!id) return;
  await db.transaction.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

export async function deleteMovement(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const caseId = formData.get("caseId") as string;

  if (!id) return;
  await db.movement.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
}

// --- FUNCIONES DE EDICIÓN (UPDATE) ---

export async function updateClient(formData: FormData) {
  const id = formData.get("id") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
  // Función auxiliar para limpiar campos vacíos
  // Función auxiliar mejorada
  const getVal = (key: string) => {
    const val = formData.get(key) as string;
    // Si está vacío O si el usuario eligió la opción de "borrar"
    if (!val || val === "EMPTY_SELECTION") return null; 
    return val;
  };

  // Identificación
  const docType = formData.get("docType") as string;
  const dni = getVal("dni");
  const cuit = getVal("cuit");

  // Personales
  const gender = getVal("gender");
  const nationality = getVal("nationality");
  const birthPlace = getVal("birthPlace");
  const occupation = getVal("occupation");
  const civilStatus = getVal("civilStatus");
  
  // Fecha: Conversión de texto a fecha real
  const rawDate = formData.get("birthDate") as string;
  // Le agregamos "T12:00:00" para fijarlo al mediodía y evitar el cambio de día por zona horaria
const birthDate = rawDate ? new Date(rawDate + "T12:00:00") : null;

  // Ubicación y Contacto
  const address = getVal("address");
  const location = getVal("location"); // Ciudad de Santa Fe
  const phone = getVal("phone");
  const email = getVal("email");
  const familyPhone = getVal("familyPhone");
  
  if (!id) return;

  await db.client.update({
    where: { id },
    data: { 
        firstName, lastName, 
        docType, dni, cuit,
        gender, birthDate, birthPlace, nationality, occupation, civilStatus,
        address, location, phone, email, familyPhone
    }
  });
  
  revalidatePath(`/client/${id}`);
  revalidatePath("/");
}

export async function updateCase(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  
  // Datos a actualizar
  const caratula = formData.get("caratula") as string;
  const juzgado = formData.get("juzgado") as string;
  const code = formData.get("code") as string; // 👈 NUEVO: Leemos el código
  const status = formData.get("status") as any;

  if (!id) return;

  await db.case.update({
    where: { id },
    data: { 
        caratula, 
        juzgado, 
        status,
        code // 👈 NUEVO: Lo guardamos en la base de datos
    }
  });

  revalidatePath(`/client/${clientId}`);
  revalidatePath(`/client/${clientId}/case/${id}`);
}