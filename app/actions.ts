"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs"; // 👈 Importante para el registro de usuarios

// ==========================================
// 🔐 AUTENTICACIÓN (LOGIN / LOGOUT)
// ==========================================

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    // 👇 redirect: false para permitir manejo en cliente (window.location.href)
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false, 
    });

    return "success"; 

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// ==========================================
// 👥 GESTIÓN DE EQUIPO (REGISTER)
// ==========================================

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const passwordRaw = formData.get("password") as string;
  const role = formData.get("role") as string || "USER"; 

  if (!name || !email || !passwordRaw) {
    return { error: "Faltan datos obligatorios." };
  }

  // 1. Verificar si ya existe
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Este email ya está registrado." };
  }

  // 2. Encriptar contraseña
  const hashedPassword = await bcrypt.hash(passwordRaw, 10);

  // 3. Crear usuario
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  revalidatePath("/team");
  return { success: "Usuario creado correctamente." };
}

export async function deleteUser(formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) return;
    
    // Opcional: Evitar borrar tu propio usuario o al admin principal aquí si quisieras
    await db.user.delete({ where: { id } });
    revalidatePath("/team");
}

// ==========================================
// 👤 CLIENTES
// ==========================================

export async function createClient(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
  const getVal = (key: string) => {
    const val = formData.get(key) as string;
    if (!val || val === "EMPTY_SELECTION") return null; 
    return val;
  };

  const docType = formData.get("docType") as string;
  const dni = getVal("dni");
  const cuit = getVal("cuit");
  const gender = getVal("gender");
  const nationality = getVal("nationality");
  const birthPlace = getVal("birthPlace");
  const occupation = getVal("occupation");
  const civilStatus = getVal("civilStatus");
  
  const rawDate = formData.get("birthDate") as string;
  const birthDate = rawDate ? new Date(rawDate + "T12:00:00") : null;

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

export async function updateClient(formData: FormData) {
  const id = formData.get("id") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
  const getVal = (key: string) => {
    const val = formData.get(key) as string;
    if (!val || val === "EMPTY_SELECTION") return null; 
    return val;
  };

  const docType = formData.get("docType") as string;
  const dni = getVal("dni");
  const cuit = getVal("cuit");
  const gender = getVal("gender");
  const nationality = getVal("nationality");
  const birthPlace = getVal("birthPlace");
  const occupation = getVal("occupation");
  const civilStatus = getVal("civilStatus");
  
  const rawDate = formData.get("birthDate") as string;
  const birthDate = rawDate ? new Date(rawDate + "T12:00:00") : null;
  
  const address = getVal("address");
  const location = getVal("location");
  const phone = getVal("phone");
  const email = getVal("email");
  const familyPhone = getVal("familyPhone");
  
  if (!id) return;

  await db.client.update({
    where: { id },
    data: { 
        firstName, lastName, docType, dni, cuit,
        gender, birthDate, birthPlace, nationality, occupation, civilStatus,
        address, location, phone, email, familyPhone
    }
  });
  
  revalidatePath(`/client/${id}`);
  revalidatePath("/");
}

export async function deleteClient(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.client.delete({ where: { id } });
  revalidatePath("/");
}

// ==========================================
// ⚖️ EXPEDIENTES (CASES)
// ==========================================

export async function createCase(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const caratula = formData.get("caratula") as string;
  const code = formData.get("code") as string;
  const juzgado = formData.get("juzgado") as string;
  const description = formData.get("description") as string;
  const area = (formData.get("area") as string) || "CIVIL";

  if (!clientId || !caratula) return;

  await db.case.create({
    data: {
      caratula, code, juzgado, description, clientId, area
    },
  });
    
  revalidatePath(`/client/${clientId}`);
}

export async function editCase(formData: FormData) {
  const id = formData.get("id") as string;
  
  const caratula = formData.get("caratula") as string;
  const juzgado = formData.get("juzgado") as string;
  const code = formData.get("code") as string;
  
  // 👇 FIX: Usamos 'any' para evitar conflicto de tipos con Prisma Enum
  const status = formData.get("status") as any; 
  
  const totalFeeString = formData.get("totalFee") as string;
  const totalFee = totalFeeString ? parseFloat(totalFeeString) : 0;
  
  const driveLinkRaw = formData.get("driveLink") as string;
  const driveLink = driveLinkRaw && driveLinkRaw.trim() !== "" ? driveLinkRaw : null;
  
  const area = (formData.get("area") as string) || "CIVIL";
  const description = formData.get("description") as string;

  if (!id) return;

  await db.case.update({
    where: { id },
    data: { 
        caratula, juzgado, status, code, totalFee, driveLink, area, description
    }
  });

  revalidatePath("/");
}

export async function deleteCase(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  if (!id) return;
  await db.case.delete({ where: { id } });
  revalidatePath(`/client/${clientId}`);
}

// ==========================================
// 📜 MOVIMIENTOS
// ==========================================

export async function createMovement(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;

  if (!caseId || !title || !dateStr) return;

  await db.movement.create({
    data: { caseId, title, description, date: new Date(dateStr) },
  });

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

// ==========================================
// 📅 AGENDA (EVENTOS)
// ==========================================

export async function createEvent(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as "HEARING" | "DEADLINE" | "MEETING";

  if (!caseId || !title || !dateStr || !type) return;

  await db.event.create({
    data: { caseId, title, description, type, date: new Date(dateStr), isDone: false },
  });

  revalidatePath(`/client/${clientId}/case/${caseId}`);
  revalidatePath("/");
}

export async function toggleEventStatus(eventId: string, currentStatus: boolean) {
  await db.event.update({
    where: { id: eventId },
    data: { isDone: !currentStatus }
  });
  revalidatePath("/");
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const caseId = formData.get("caseId") as string;
  if (!id) return;
  await db.event.delete({ where: { id } });
  revalidatePath(`/client/${clientId}/case/${caseId}`);
  revalidatePath("/");
}

// ==========================================
// 💰 TRANSACCIONES (CAJA)
// ==========================================

export async function createTransaction(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const clientId = formData.get("clientId") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as string; // INCOME o EXPENSE

  if (!caseId || !amount || !type) return;

  await db.transaction.create({
    data: { caseId, description, amount, type },
  });

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

// ==========================================
// 🔍 BÚSQUEDA GLOBAL
// ==========================================

export async function searchGlobal(query: string) {
  if (!query || query.length < 2) return { clients: [], cases: [] };

  const term = query.trim();

  // 1. Buscar Clientes (Nombre, Apellido, DNI)
  const clients = await db.client.findMany({
    where: {
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { dni: { contains: term } },
      ],
    },
    take: 5,
    select: { id: true, firstName: true, lastName: true, dni: true },
  });

  // 2. Buscar Expedientes (Carátula, Número, Juzgado)
  const cases = await db.case.findMany({
    where: {
      OR: [
        { caratula: { contains: term, mode: "insensitive" } },
        { code: { contains: term, mode: "insensitive" } },
        { juzgado: { contains: term, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: { id: true, caratula: true, code: true, clientId: true },
  });

  return { clients, cases };
}