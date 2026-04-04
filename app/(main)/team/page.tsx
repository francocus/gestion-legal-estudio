import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deleteUser, setUserStatus } from "@/lib/actions/users";
import { CreateUserForm } from "@/components/create-user-form";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { ResetUserPasswordDialog } from "@/components/reset-user-password-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Trash2, Shield, User as UserIcon, Clock3, KeyRound, PauseCircle, PlayCircle } from "lucide-react";

function getRoleLabel(role: string) {
  return role === "ADMIN" ? "Administrador" : "Usuario";
}

function getStatusLabel(status: string) {
  return status === "SUSPENDED" ? "Suspendido" : "Activo";
}

function getAuditActionLabel(action: string) {
  switch (action) {
    case "USER_CREATED":
      return "Alta de usuario";
    case "USER_UPDATED":
      return "Edicion de usuario";
    case "USER_PASSWORD_RESET":
      return "Reset de clave";
    case "USER_STATUS_UPDATED":
      return "Cambio de estado";
    case "USER_DELETED":
      return "Eliminacion";
    case "LOGIN_SUCCESS":
      return "Ingreso correcto";
    case "LOGIN_FAILED":
      return "Intento fallido";
    case "LOGIN_BLOCKED":
      return "Acceso bloqueado";
    case "LOGOUT":
      return "Cierre de sesion";
    case "SWITCH_USER":
      return "Cambio de usuario";
    case "PASSWORD_CHANGED":
      return "Cambio de clave";
    default:
      return action;
  }
}

function formatDateTime(date: Date | null) {
  if (!date) return "Sin ingreso registrado";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function TeamPage() {
  const session = await auth();
  const actorEmail = session?.user?.email || "";

  const [users, auditLogs] = await Promise.all([
    db.user.findMany({
      orderBy: [{ status: "asc" }, { role: "asc" }, { name: "asc" }],
    }),
    db.userAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const suspendedUsers = users.filter((user) => user.status === "SUSPENDED").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const activeAdmins = users.filter((user) => user.role === "ADMIN" && user.status === "ACTIVE").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestion de equipo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuarios activos</CardDescription>
            <CardTitle className="text-3xl">{activeUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-3xl">{admins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuarios suspendidos</CardDescription>
            <CardTitle className="text-3xl">{suspendedUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" /> Nuevo usuario
              </CardTitle>
              <CardDescription>
                Crear credenciales y definir el rol inicial del nuevo integrante.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateUserForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-amber-500" /> Auditoria reciente
              </CardTitle>
              <CardDescription>Ultimas acciones administrativas sobre usuarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500">Todavia no hay movimientos registrados.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {log.user.name || log.user.email}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{getAuditActionLabel(log.action)}</p>
                    {log.details && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{log.details}</p>}
                    {log.actorEmail && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Por: {log.actorEmail}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" /> Usuarios del sistema
            </CardTitle>
            <CardDescription>Editar perfil, rol, acceso, contraseña y ver ultimo ingreso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ultimo acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = Boolean(actorEmail && user.email === actorEmail);
                  const isLastActiveAdmin = user.role === "ADMIN" && user.status === "ACTIVE" && activeAdmins <= 1;
                  const disableSuspend = user.status === "ACTIVE" && (isSelf || isLastActiveAdmin);
                  const disableDelete = isSelf || isLastActiveAdmin;
                  const canChangeRole = !(isSelf || isLastActiveAdmin);

                  return (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <UserIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name || "Usuario"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          {user.mustChangePassword && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                              <KeyRound className="h-3 w-3" /> Clave provisoria
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === "ADMIN" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDateTime(user.lastLoginAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <EditUserDialog user={user} actorEmail={actorEmail} canChangeRole={canChangeRole} />
                        <ResetUserPasswordDialog userId={user.id} actorEmail={actorEmail} />

                        <form action={async (formData) => {
                          "use server";
                          await setUserStatus(formData);
                        }}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="actorEmail" value={actorEmail} />
                          <input type="hidden" name="status" value={user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={disableSuspend}
                            title={
                              disableSuspend
                                ? isSelf
                                  ? "No podes suspender tu propia cuenta."
                                  : "No podes suspender al ultimo administrador activo."
                                : undefined
                            }
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="h-3.5 w-3.5" /> Suspender
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-3.5 w-3.5" /> Activar
                              </>
                            )}
                          </Button>
                        </form>

                        <form action={async (formData) => {
                          "use server";
                          await deleteUser(formData);
                        }}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="actorEmail" value={actorEmail} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700"
                            disabled={disableDelete}
                            title={
                              disableDelete
                                ? isSelf
                                  ? "No podes eliminar tu propia cuenta."
                                  : "No podes eliminar al ultimo administrador activo."
                                : undefined
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
