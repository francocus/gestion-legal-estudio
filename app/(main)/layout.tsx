import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Verificamos la sesión
  const session = await auth();

  // 2. Validaciones súper estrictas: Si no hay sesión, usuario, o email, afuera.
  if (!session || !session.user || !session.user.email) {
    redirect("/login");
  }

  // 3. Buscamos el usuario completo en la base de datos de forma segura
  const user = await db.user.findUnique({
    where: { 
      email: session.user.email 
    }
  });

  // 4. DOBLE CHEQUEO: Si tiene sesión en el navegador pero lo borramos de la DB
  if (!user) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/cambiar-clave");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 5. Le pasamos el usuario a la Navbar para que filtre botones (ej: Panel Admin) */}
      <Navbar user={user} />
      
      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
