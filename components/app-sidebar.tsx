"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Calendar,
  BookOpen,
  Users,
  Wallet,
  ReceiptText,
  UserCog,
  Scale,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function NavLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href} aria-current={isActive ? "page" : undefined}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const { open } = useSidebar();
  const roleLabel =
    user.role === "ADMIN" ? "Administrador" : user.role === "USER" ? "Usuario" : "Usuario";

  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/contabilidad", label: "Contabilidad", icon: Wallet },
    { href: "/obligaciones", label: "Obligaciones", icon: ReceiptText },
  ];

  if (user.role === "ADMIN") {
    items.push({ href: "/team", label: "Equipo", icon: UserCog });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="gap-3">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                {open && (
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    Estudio Juridico
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default pointer-events-none"
              aria-label="Usuario actual"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              {open && (
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-semibold max-w-[140px] truncate">
                    {user.name || user.email || "Usuario"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
