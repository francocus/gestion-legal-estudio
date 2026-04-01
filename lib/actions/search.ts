"use server";

import { db } from "@/lib/db";

export async function searchGlobal(query: string) {
  if (!query || query.length < 2) return { clients: [], cases: [] };

  const term = query.trim();

  const clients = await db.client.findMany({
    where: {
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { dni: { contains: term } },
        { phone: { contains: term } },
      ],
    },
    take: 5,
    select: { id: true, firstName: true, lastName: true, dni: true, phone: true },
  });

  const cases = await db.case.findMany({
    where: {
      OR: [
        { caratula: { contains: term, mode: "insensitive" } },
        { code: { contains: term, mode: "insensitive" } },
        { juzgado: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { area: { contains: term, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: {
      id: true,
      caratula: true,
      code: true,
      clientId: true,
      isExtrajudicial: true,
      area: true,
    },
  });

  return { clients, cases };
}
