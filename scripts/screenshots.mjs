import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "screenshots");
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const credentials = { email: "admin@legal.com", password: "demo1234" };

const prisma = new PrismaClient();

async function resolveRoutes() {
  const suarez = await prisma.client.findFirst({
    where: { dni: "30111222" },
    select: { id: true },
  });
  const laboral = await prisma.case.findFirst({
    where: { code: "LAB-2026-001" },
    select: { id: true },
  });
  const acuerdo = await prisma.case.findFirst({
    where: { code: "AC-2026-014" },
    select: { id: true },
  });

  if (!suarez || !laboral || !acuerdo) {
    throw new Error(
      "Faltan datos demo. Corre `npx prisma db seed` antes de capturar."
    );
  }

  return [
    { name: "dashboard", path: "/" },
    { name: "clientes", path: "/clientes" },
    { name: "cliente-detalle", path: `/client/${suarez.id}`, fullPage: true },
    { name: "expediente", path: `/client/${suarez.id}/case/${laboral.id}`, fullPage: true },
    {
      name: "expediente-extrajudicial",
      path: `/client/${suarez.id}/case/${acuerdo.id}`,
      fullPage: true,
    },
    { name: "agenda", path: "/agenda" },
    { name: "contabilidad", path: "/contabilidad" },
    { name: "obligaciones", path: "/obligaciones" },
    { name: "biblioteca", path: "/biblioteca" },
    { name: "biblioteca-ia", path: "/biblioteca/ia-demo" },
    { name: "team", path: "/team" },
  ];
}

async function capture(page, route) {
  await page
    .goto(`${baseURL}${route.path}`, { waitUntil: "networkidle", timeout: 45000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(outputDir, `${route.name}.png`),
    fullPage: Boolean(route.fullPage),
  });
  console.log(`capturado: ${route.name}`);
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/", { timeout: 45000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function main() {
  mkdirSync(outputDir, { recursive: true });
  const routes = await resolveRoutes();

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const publicContext = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    locale: "es-AR",
  });
  await publicContext.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${baseURL}/login`, { waitUntil: "networkidle" }).catch(() => {});
  await publicPage.waitForTimeout(600);
  await publicPage.screenshot({ path: join(outputDir, "login.png") });
  console.log("capturado: login");
  await capture(publicPage, { name: "switch-user", path: "/switch-user" });
  await publicContext.close();

  const authContext = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    locale: "es-AR",
  });
  await authContext.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  });
  const page = await authContext.newPage();
  await login(page);
  for (const route of routes) {
    await capture(page, route);
  }
  await authContext.close();

  await browser.close();
  console.log(`\nListo. Capturas en ${outputDir}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
