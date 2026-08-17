import { getOptionalString, getRequiredString, getStringWithDefault } from "@/lib/actions/form-data";
import { actionError, ActionResult } from "@/lib/actions/action-result";
import { RevalidatePath } from "./types";

export async function registerUserWithDeps(
  prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
  deps: {
    findUserByEmail(email: string): Promise<{ id: string } | null>;
    hashPassword(password: string): Promise<string>;
    createUser(data: { name: string; email: string; password: string; role: string; mustChangePassword: boolean }): Promise<{ id: string } | null>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
) {
  void prevState;

  const name = getRequiredString(formData, "name");
  const email = getRequiredString(formData, "email");
  const passwordRaw = getRequiredString(formData, "password");
  const role = getStringWithDefault(formData, "role", "USER");
  const actorEmail = getOptionalString(formData, "actorEmail");

  if (!name || !email || !passwordRaw) {
    return { error: "Faltan datos obligatorios." };
  }

  const existingUser = await deps.findUserByEmail(email);

  if (existingUser) {
    return { error: "Este email ya está registrado." };
  }

  const hashedPassword = await deps.hashPassword(passwordRaw);

  const createdUser = await deps.createUser({
    name,
    email,
    password: hashedPassword,
    role,
    mustChangePassword: true,
  });

  if (createdUser?.id && deps.createAuditLog) {
    await deps.createAuditLog({
      userId: createdUser.id,
      actorEmail,
      action: "USER_CREATED",
      details: `Alta de usuario con rol ${role}.`,
    });
  }

  deps.revalidatePath("/team");
  return { success: "Usuario creado correctamente." };
}

interface TeamSecurityUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

function isLastActiveAdmin(user: TeamSecurityUser, activeAdmins: number) {
  return user.role === "ADMIN" && user.status === "ACTIVE" && activeAdmins <= 1;
}

export async function deleteUserWithDeps(
  formData: FormData,
  deps: {
    findUserById(id: string): Promise<TeamSecurityUser | null>;
    countActiveAdmins(): Promise<number>;
    deleteUser(id: string): Promise<unknown>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const actorEmail = getOptionalString(formData, "actorEmail");
  if (!id) return actionError("No se pudo identificar el usuario.");

  const targetUser = await deps.findUserById(id);
  if (!targetUser) {
    return actionError("El usuario ya no existe.");
  }

  if (actorEmail && targetUser.email === actorEmail) {
    return actionError("No podes eliminar tu propia cuenta.");
  }

  const activeAdmins = await deps.countActiveAdmins();
  if (isLastActiveAdmin(targetUser, activeAdmins)) {
    return actionError("No podes eliminar al ultimo administrador activo del sistema.");
  }

  if (deps.createAuditLog) {
    await deps.createAuditLog({
      userId: id,
      actorEmail,
      action: "USER_DELETED",
      details: `Baja de usuario ${targetUser.email} desde equipo.`,
    });
  }

  await deps.deleteUser(id);
  deps.revalidatePath("/team");
  return { success: true, message: "Usuario eliminado correctamente." };
}

export async function updateUserWithDeps(
  formData: FormData,
  deps: {
    findUserById(id: string): Promise<TeamSecurityUser | null>;
    countActiveAdmins(): Promise<number>;
    findUserByEmail(email: string): Promise<{ id: string } | null>;
    updateUser(id: string, data: { name: string; email: string; role: string }): Promise<unknown>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const name = getRequiredString(formData, "name");
  const email = getRequiredString(formData, "email");
  const role = getStringWithDefault(formData, "role", "USER");
  const actorEmail = getOptionalString(formData, "actorEmail");

  if (!id || !name || !email) {
    return actionError("Faltan datos obligatorios del usuario.");
  }

  const existingUser = await deps.findUserByEmail(email);
  if (existingUser && existingUser.id !== id) {
    return actionError("Ya existe otro usuario con ese email.");
  }

  const currentUser = await deps.findUserById(id);
  if (!currentUser) {
    return actionError("El usuario ya no existe.");
  }

  if (actorEmail && currentUser.email === actorEmail && currentUser.role !== role) {
    return actionError("No podes cambiar tu propio rol desde esta pantalla.");
  }

  const activeAdmins = await deps.countActiveAdmins();
  if (currentUser.role === "ADMIN" && role !== "ADMIN" && isLastActiveAdmin(currentUser, activeAdmins)) {
    return actionError("No podes cambiar el rol del ultimo administrador activo.");
  }

  await deps.updateUser(id, { name, email, role });

  if (deps.createAuditLog) {
    await deps.createAuditLog({
      userId: id,
      actorEmail,
      action: "USER_UPDATED",
      details: `Actualizacion de perfil. Nombre: ${name}. Email: ${email}. Rol asignado: ${role}.`,
    });
  }

  deps.revalidatePath("/team");
  return { success: true, message: "Usuario actualizado correctamente." };
}

export async function resetUserPasswordWithDeps(
  formData: FormData,
  deps: {
    hashPassword(password: string): Promise<string>;
    updatePassword(id: string, data: { password: string; mustChangePassword: boolean }): Promise<unknown>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const passwordRaw = getRequiredString(formData, "password");
  const actorEmail = getOptionalString(formData, "actorEmail");

  if (!id || !passwordRaw || passwordRaw.length < 6) {
    return actionError("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const hashedPassword = await deps.hashPassword(passwordRaw);
  await deps.updatePassword(id, { password: hashedPassword, mustChangePassword: true });

  if (deps.createAuditLog) {
    await deps.createAuditLog({
      userId: id,
      actorEmail,
      action: "USER_PASSWORD_RESET",
      details: "Reseteo de contraseña provisoria por administrador.",
    });
  }

  deps.revalidatePath("/team");
  return { success: true, message: "Contraseña provisoria actualizada." };
}

export async function changeOwnPasswordWithDeps(
  formData: FormData,
  deps: {
    findUserByEmail(email: string): Promise<{ id: string; password: string } | null>;
    comparePassword(plain: string, hashed: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
    updatePassword(id: string, data: { password: string; mustChangePassword: boolean }): Promise<unknown>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
  }
): Promise<ActionResult> {
  const email = getRequiredString(formData, "email");
  const currentPassword = getRequiredString(formData, "currentPassword");
  const password = getRequiredString(formData, "password");
  const confirmPassword = getRequiredString(formData, "confirmPassword");

  if (!email || !currentPassword || !password || !confirmPassword) {
    return actionError("Completa todos los datos obligatorios.");
  }

  if (password.length < 6) {
    return actionError("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  if (password !== confirmPassword) {
    return actionError("La confirmacion no coincide con la nueva contraseña.");
  }

  const user = await deps.findUserByEmail(email);
  if (!user) {
    return actionError("No se pudo validar la cuenta actual.");
  }

  const validCurrentPassword = await deps.comparePassword(currentPassword, user.password);
  if (!validCurrentPassword) {
    return actionError("La contraseña actual no es correcta.");
  }

  const samePassword = await deps.comparePassword(password, user.password);
  if (samePassword) {
    return actionError("La nueva contraseña debe ser distinta de la actual.");
  }

  const hashedPassword = await deps.hashPassword(password);
  await deps.updatePassword(user.id, { password: hashedPassword, mustChangePassword: false });

  if (deps.createAuditLog) {
    await deps.createAuditLog({
      userId: user.id,
      actorEmail: email,
      action: "PASSWORD_CHANGED",
      details: "Actualizacion de contraseña obligatoria o voluntaria por el propio usuario.",
    });
  }

  return { success: true, message: "Contraseña actualizada correctamente." };
}

export async function setUserStatusWithDeps(
  formData: FormData,
  deps: {
    findUserById(id: string): Promise<TeamSecurityUser | null>;
    countActiveAdmins(): Promise<number>;
    updateStatus(id: string, data: { status: string }): Promise<unknown>;
    createAuditLog?(data: { userId: string; actorEmail?: string | null; action: string; details?: string | null }): Promise<unknown>;
    revalidatePath: RevalidatePath;
  }
): Promise<ActionResult> {
  const id = getRequiredString(formData, "id");
  const status = getRequiredString(formData, "status");
  const actorEmail = getOptionalString(formData, "actorEmail");

  if (!id || !["ACTIVE", "SUSPENDED"].includes(status)) {
    return actionError("No se pudo actualizar el estado del usuario.");
  }

  const targetUser = await deps.findUserById(id);
  if (!targetUser) {
    return actionError("El usuario ya no existe.");
  }

  if (actorEmail && targetUser.email === actorEmail && status === "SUSPENDED") {
    return actionError("No podes suspender tu propia cuenta.");
  }

  const activeAdmins = await deps.countActiveAdmins();
  if (status === "SUSPENDED" && isLastActiveAdmin(targetUser, activeAdmins)) {
    return actionError("No podes suspender al ultimo administrador activo del sistema.");
  }

  await deps.updateStatus(id, { status });

  if (deps.createAuditLog) {
    await deps.createAuditLog({
      userId: id,
      actorEmail,
      action: "USER_STATUS_UPDATED",
      details: `Estado actualizado a ${status === "ACTIVE" ? "activo" : "suspendido"} para ${targetUser.email}.`,
    });
  }

  deps.revalidatePath("/team");
  return { success: true, message: "Estado actualizado correctamente." };
}
