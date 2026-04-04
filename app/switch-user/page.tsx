import Link from "next/link";
import { db } from "@/lib/db";
import { Scale, Plus, Shield, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

function getRoleLabel(role?: string | null) {
  if (role === "ADMIN") return "Administrador";
  if (role === "USER") return "Usuario";
  return role || "Usuario";
}

function getRoleIcon(role?: string | null) {
  return role === "ADMIN" ? Shield : Briefcase;
}

function getAccent(index: number) {
  const accents = [
    "from-blue-500 to-cyan-400",
    "from-emerald-500 to-teal-400",
    "from-amber-500 to-orange-400",
    "from-fuchsia-500 to-pink-400",
    "from-violet-500 to-indigo-400",
  ];

  return accents[index % accents.length];
}

export default async function SwitchUserPage() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.95),_transparent_44%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 w-full max-w-6xl text-center">
        <div className="mb-10 flex items-center justify-center gap-3 text-left md:justify-start">
          <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-950/30">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-white md:text-2xl">Estudio Juridico</p>
            <p className="text-sm text-slate-400">Elegí con qué cuenta querés continuar</p>
          </div>
        </div>

        <h1 className="mb-10 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          ¿Quién va a ingresar?
        </h1>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {users.map((user, index) => {
            const RoleIcon = getRoleIcon(user.role);
            const initials = (user.name || user.email || "U")
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("");

            return (
              <Link
                key={user.id}
                href={`/login?switch=1&email=${encodeURIComponent(user.email || "")}&name=${encodeURIComponent(user.name || "")}`}
                className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-left transition-all hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-900"
              >
                <div className={`mb-4 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br ${getAccent(index)} shadow-inner`}>
                  <span className="text-4xl font-black tracking-tight text-white">{initials || "U"}</span>
                </div>
                <div className="space-y-2">
                  <p className="truncate text-lg font-semibold text-white">{user.name || "Usuario"}</p>
                  <p className="truncate text-sm text-slate-400">{user.email}</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    <RoleIcon className="h-3.5 w-3.5 text-blue-400" />
                    {getRoleLabel(user.role)}
                  </div>
                </div>
              </Link>
            );
          })}

          <Link
            href="/login"
            className="group flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center transition-all hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-900/70"
          >
            <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors group-hover:text-white">
              <Plus className="h-10 w-10" />
            </div>
            <p className="text-lg font-semibold text-slate-200">Usar otra cuenta</p>
            <p className="mt-2 text-sm text-slate-500">Ingresar manualmente con otro correo</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
