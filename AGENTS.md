# AGENTS.md

Contexto para trabajar en este repo. Leé esto completo antes de tocar código.

## Qué es esto

Sistema de gestión integral para un estudio jurídico: clientes, expedientes (judiciales y extrajudiciales), agenda, contabilidad/honorarios, biblioteca jurídica con verificación de fuentes oficiales asistida por IA, y gestión de equipo/usuarios con auditoría.

Es un proyecto personal que se va a publicar como pieza de portfolio. **No está en producción con datos reales de terceros.** El objetivo actual no es agregar funcionalidades, es pulir lo existente: simplificar sobre-ingeniería, sacar restos de desarrollo, y dejarlo prolijo para que un tercero (recruiter, otro dev) lo pueda leer y entender rápido.

## Stack

- **Next.js 16** (App Router, Turbopack/webpack, `proxy.ts` como boundary de red — reemplaza a `middleware.ts` en Next 16, no es un error ni un archivo mal nombrado)
- **React 19**, TypeScript
- **Prisma 5** + PostgreSQL
- **Auth.js (NextAuth) v5 beta**, credentials provider + bcrypt, con audit log de logins (`UserAuditLog`)
- **Tailwind v4** + shadcn/ui (Radix primitives)
- **Server Actions** como capa de backend (no hay API REST propia salvo `/api/auth` y `/api/cron/boletin`)
- **Gemini** (`@google/generative-ai`) para el módulo de IA
- Generación de documentos: `docxtemplater` + `pizzip`, `jspdf`
- Calendario: FullCalendar
- Testing: **sin framework**, scripts propios corridos con `tsx` (ver abajo)

## Cómo se corre y se verifica

```bash
npm install
npm run dev          # dev server
npm run check        # lint + typecheck + test — correr esto SIEMPRE antes de dar por terminada una tarea
npm run build         # build de producción
```

`npm run test` corre cada archivo de `tests/` secuencialmente con `tsx` (no Jest/Vitest — son scripts con asserts simples). Si agregás lógica nueva a `lib/actions/services.ts` o `lib/ia/`, sumá casos ahí siguiendo el estilo existente en `tests/*.ts`.

## Arquitectura que hay que respetar

### Patrón de Server Actions con inyección de dependencias

`lib/actions/services.ts` concentra funciones `xxxWithDeps(formData, { ...dependencias })` que reciben sus dependencias (acceso a DB, `revalidatePath`, etc.) como parámetro. Los archivos en `lib/actions/*.ts` (ej. `cases.ts`, `clients.ts`) son wrappers finos marcados `"use server"` que le pasan las dependencias reales.

Esto existe para poder testear la lógica de negocio sin levantar una base de datos real (los tests importan `xxxWithDeps` y le inyectan mocks). **Es intencional, no lo elimines** — pero si el archivo se vuelve inmanejable por tamaño, se puede partir en varios archivos (`lib/actions/services/cases.ts`, etc.) manteniendo el mismo patrón. Proponé el split antes de ejecutarlo si vas a tocarlo.

### Módulo de IA / fuentes legales — no tocar la lógica

`lib/ia/legal-analysis.ts`, `lib/legal-source-fetch.ts`, `lib/legal-source-officials.ts` y `lib/actions/ia.ts` implementan: scraping de boletines oficiales (actualmente Argentina), detección de fuentes oficiales por URL, extracción de texto legible de HTML, y comparación/verificación asistida por Gemini contra el texto vigente. Es la parte más sofisticada y diferencial del proyecto — el punto que vale la pena mostrar en una entrevista. Cambios cosméticos sí, cambios de lógica no, salvo que yo lo pida explícitamente.

### Auth

`auth.config.ts` define el `authorized` callback (redirects según sesión) y se usa tanto en `auth.ts` (NextAuth completo, server) como en `proxy.ts` (boundary de red, corre en Node runtime en Next 16). No dupliques lógica de autorización fuera de estos dos archivos.

## Cosas conocidas que hay que arreglar (ver PROMPT-OPENCODE.md para el orden de trabajo)

- Restos de desarrollo: comentarios de debug en español dentro de código, un componente (`ia-comparator-demo.tsx`) que quedó sin usar, y `fix-admin.mjs` con una contraseña hardcodeada en la raíz del repo.
- No existe `.env.example` — hay que generarlo a partir de las variables que realmente usa el código.
- Los uploads de archivos (`lib/actions/cases.ts`, `lib/actions/movements.ts`) escriben a `public/uploads/` con `fs/promises`. Funciona en local pero no sobrevive un deploy serverless — hay que decidir si se migra a storage externo o se documenta como limitación en modo demo.
- Varios archivos grandes que pueden beneficiarse de un split (ver PROMPT-OPENCODE.md para la lista y tamaños).

## Reglas de trabajo

- No agregues features nuevas salvo que se pida explícitamente. Esto es depuración y pulido, no desarrollo de producto.
- Cambios grandes (splits de archivos, refactors de servicios) se proponen primero, se ejecutan después de mi confirmación.
- Cambios chicos y de bajo riesgo (limpieza de comentarios, dead code, `.env.example`) se pueden hacer directo.
- Correr `npm run check` después de cada cambio no trivial.
- Los mensajes de commit y comentarios de código que queden en el repo van en español, consistente con el resto del proyecto.
- No commitear nunca un `.env` real ni credenciales (ya está en `.gitignore`, mantenelo así).