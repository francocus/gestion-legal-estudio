import { db } from "@/lib/db";
import { deleteUser } from "@/app/actions";
// 👇 Importamos el componente nuevo
import { CreateUserForm } from "@/components/create-user-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Trash2, Shield, User as UserIcon } from "lucide-react";

export default async function TeamPage() {
  // Buscamos usuarios en la base de datos
  const users = await db.user.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (Componente Cliente) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" /> Nuevo Abogado
            </CardTitle>
            <CardDescription>
              Crear credenciales de acceso para un nuevo socio o empleado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 👇 ACÁ USAMOS EL COMPONENTE QUE CREAMOS */}
            <CreateUserForm />
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: LISTA DE USUARIOS (Server Side) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" /> Usuarios Activos
            </CardTitle>
            <CardDescription>
              Personal con acceso al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-slate-500" />
                      </div>
                      {user.name}
                    </TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell className="text-right">
                      {/* Formulario simple para borrar */}
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}