import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db"; // Necesario para buscar el rol
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Verificamos la sesión
  const session = await auth();

  // 2. Si no hay usuario logueado, lo mandamos al login
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 3. Buscamos el usuario completo en la base de datos
  // Hacemos esto para obtener el campo 'role' (ADMIN o USER)
  const user = await db.user.findUnique({
    where: { email: session.user.email }
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* 4. Le pasamos el usuario a la Navbar para que filtre botones */}
      <Navbar user={user} />
      
      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}