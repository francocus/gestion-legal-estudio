import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. Header arriba */}
      <Navbar />
      
      {/* 2. Contenido principal (ocupa el espacio restante) */}
      <main className="flex-1">
        {children}
      </main>

      {/* 3. Footer abajo (siempre al fondo gracias al flex-1 del main) */}
      <Footer />
    </div>
  );
}