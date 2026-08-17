# Sistema de Gestión Jurídica Integral

Plataforma web integral para la administración de estudios jurídicos, con enfoque internacional (Argentina y Paraguay) y adaptable a distintas jurisdicciones y materias.

Centraliza la gestión de clientes, el seguimiento de expedientes judiciales y extrajudiciales, la biblioteca jurídica con **verificación de fuentes oficiales asistida por IA**, la agenda, y el control financiero del estudio.

![Dashboard Principal](public/screenshots/dashboard.png)
*Vista general del estado financiero y la agenda prioritaria del estudio.*

---

## Diferencial técnico: verificación de fuentes legales con IA

El módulo más interesante del proyecto: la biblioteca jurídica no solo guarda textos, sino que **verifica automáticamente si la versión guardada sigue vigente** contra la fuente oficial.

- **Scraping de boletines y portales oficiales** (Infoleg para Argentina, CSJ-IIJ para Paraguay): detecta si la URL pertenece a una fuente oficial reconocida y extrae el texto normativo vigente.
- **Comparación asistida por Gemini**: cuando hay una posible modificación, la IA compara el texto guardado con el vigente y decide si marcó la ley como desactualizada, resguardando el texto anterior (`previousText`) para auditoría.
- **Ficha manual asistida**: si una fuente se carga a mano, la IA completa título canónico, número oficial, fecha de publicación y síntesis, validando su utilidad antes de persistir.

Esta pieza combina scraping, parsing de HTML, detección de fuentes por dominio y un pipeline de validación con LLM — es lo que más vale la pena mostrar en una entrevista. La lógica vive en `lib/ia/`, `lib/legal-source-fetch.ts` y `lib/legal-source-officials.ts`.

---

## Stack tecnológico

- **Frontend:** Next.js 16 (App Router, React 19, TypeScript)
- **Estilos & UI:** Tailwind CSS v4, shadcn/ui (Radix)
- **Backend:** Server Actions
- **Base de datos:** PostgreSQL + Prisma 5
- **Autenticación:** Auth.js (NextAuth v5) con credentials y bcrypt, audit log de logins
- **IA:** Google Gemini (`@google/generative-ai`)
- **Calendario:** FullCalendar · **Documentos:** docxtemplater / jspdf

---

## Cómo levantar el proyecto en local

### Requisitos

- Node.js 20+
- PostgreSQL corriendo (local o remoto)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Completá DATABASE_URL, DIRECT_URL, AUTH_SECRET y GEMINI_API_KEY en el .env

# 3. Preparar la base de datos
npx prisma migrate dev

# 4. Cargar datos de demostración (usuarios, clientes, expedientes, biblioteca)
npm run seed          # o: npx prisma db seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

> `AUTH_SECRET` se genera con `npx auth secret`. `GEMINI_API_KEY` se obtiene en Google AI Studio. Sin la API key, el sistema funciona pero el módulo de IA no responde.

### Usuarios de demostración (creados por el seed)

| Email | Rol | Contraseña |
|---|---|---|
| `admin@legal.com` | Admin | `demo1234` |
| `socio@demo.local` | Admin | `demo1234` |
| `abogada@demo.local` | Usuario | `demo1234` |
| `jr@demo.local` | Usuario | `demo1234` |

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run check      # lint + typecheck + tests (corré esto antes de terminar cualquier tarea)
npm run build      # build de producción
npm run test       # solo los tests
```

---

## Testing: por qué `tsx` + asserts y no Jest/Vitest

Los tests corren con **scripts propios** ejecutados con `tsx` (sin framework externo). No es una limitación, es una decisión deliberada:

- **El patrón de Server Actions con inyección de dependencias** (`xxxWithDeps`) hace que la lógica de negocio sea testeable sin levantar una base de datos: los tests importan la función y le inyectan mocks para el acceso a DB y `revalidatePath`.
- Con asserts simples de `node:assert` basta para validar comportamiento. No hay necesidad de un runner pesado ni de mocks mágicos: el diseño ya aísla las dependencias.
- Mantiene el proyecto liviano (cero config de tooling extra) y los tests se ejecutan en milisegundos.

Cada archivo en `tests/*.ts` se ejecuta secuencialmente con `tsx`. Para verlos: `npm run test`.

---

## Arquitectura que vale la pena conocer

### Server Actions con inyección de dependencias

`lib/actions/services/` concentra las funciones `xxxWithDeps(formData, { ...dependencias })`, que reciben su acceso a la DB y `revalidatePath` como parámetro. Los archivos en `lib/actions/*.ts` son wrappers finos marcados `"use server"` que inyectan las dependencias reales. Esto es lo que hace testear sin DB real y está partido por dominio (`services/cases.ts`, `services/accounting.ts`, etc.).

### Límites de red y auth

`proxy.ts` actúa como boundary de red en Next 16 (reemplaza a `middleware.ts`) y `auth.config.ts` define el callback de autorización compartido entre el servidor y el proxy — sin duplicar lógica.

---

## Limitación conocida: uploads de archivos

La carga de documentos de expedientes y movimientos escribe a `public/uploads/` con `fs/promises` (ver `lib/actions/cases.ts` y `lib/actions/movements.ts`). **Funciona correctamente en local**, pero en un deploy serverless (Vercel) el filesystem es efímero y de solo lectura, por lo que **los archivos no persisten** en producción. Para un demo local no hay ningún problema; si se quisiera persistir en la nube, habría que migrar a un storage externo (p. ej. Vercel Blob).

---

## Estado del proyecto

Sistema operativo y estable, publicado como pieza de portfolio. La base principal está consolidada y la arquitectura está pensada para seguir expandiendo módulos jurídicos, contables y de análisis.
