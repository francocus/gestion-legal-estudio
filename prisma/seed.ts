import bcrypt from "bcryptjs";
import {
  CaseStatus,
  EventType,
  LegalSourceType,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedClient = {
  firstName: string;
  lastName: string;
  docType: string;
  dni: string;
  cuit?: string;
  nationality: string;
  phone: string;
  familyPhone?: string;
  email: string;
  address: string;
  location: string;
  occupation?: string;
  birthPlace?: string;
};

type SeedCase = {
  caratula: string;
  code: string | null;
  juzgado: string | null;
  description: string;
  status: CaseStatus;
  isExtrajudicial: boolean;
  totalFee: number;
  driveLink?: string;
  area: string;
  notes: Array<{ content: string; type: string }>;
  movements: Array<{ title: string; description: string; dateOffsetDays: number }>;
  transactions: Array<{ description: string; amount: number; type: string; dateOffsetDays: number }>;
  entries: Array<{ description: string; concept: string; debe: number; haber: number; dateOffsetDays: number }>;
  events: Array<{ title: string; description: string; type: EventType; dateOffsetDays: number }>;
  sourceTitles: string[];
};

function daysFromNow(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

async function seedUsers() {
  const password = await bcrypt.hash("demo1234", 10);

  const users = [
    { email: "admin@legal.com", name: "Admin Estudio", role: "ADMIN" },
    { email: "socio@demo.local", name: "Socio Principal", role: "ADMIN" },
    { email: "abogada@demo.local", name: "Abogada Senior", role: "USER" },
    { email: "jr@demo.local", name: "Abogado Junior", role: "USER" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password,
      },
      create: {
        ...user,
        password,
      },
    });
  }
}

async function seedLegalSources() {
  const sources = [
    {
      title: "Constitucion de la Nacion Argentina",
      type: LegalSourceType.CONSTITUTION,
      area: "CONSTITUCIONAL",
      country: "Argentina",
      content:
        "Art. 14 bis. El trabajo en sus diversas formas gozara de la proteccion de las leyes y asegura condiciones dignas y equitativas.",
      sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/constitucion-nacional-804",
    },
    {
      title: "Codigo Civil y Comercial de la Nacion",
      type: LegalSourceType.CODE,
      area: "CIVIL",
      country: "Argentina",
      content:
        "Art. 1. Los casos que este Codigo rige deben resolverse segun las leyes aplicables y la Constitucion Nacional.",
      sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/ley-26994-235975",
    },
    {
      title: "Ley de Contrato de Trabajo Nro. 20744",
      type: LegalSourceType.LAW,
      area: "LABORAL",
      country: "Argentina",
      content:
        "Art. 21. Habra contrato de trabajo cuando una persona se obligue a realizar actos, ejecutar obras o prestar servicios en favor de otra.",
      sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/ley-20744-25552",
    },
    {
      title: "Ley de Defensa del Consumidor Nro. 24240",
      type: LegalSourceType.LAW,
      area: "CIVIL",
      country: "Argentina",
      content:
        "Art. 4. El proveedor esta obligado a suministrar al consumidor informacion cierta, clara y detallada.",
      sourceUrl: "https://www.argentina.gob.ar/normativa/nacional/ley-24240-638",
    },
    {
      title: "Codigo Penal de la Nacion Argentina",
      type: LegalSourceType.CODE,
      area: "PENAL",
      country: "Argentina",
      content:
        "Art. 79. Se aplicara reclusion o prision al que matare a otro siempre que no corresponda otra pena.",
      sourceUrl: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16546/texact.htm",
    },
    {
      title: "Constitucion de la Republica del Paraguay",
      type: LegalSourceType.CONSTITUTION,
      area: "CONSTITUCIONAL",
      country: "Paraguay",
      content:
        "Art. 1. La Republica del Paraguay es para siempre libre e independiente y se constituye en Estado social de derecho.",
      sourceUrl: "https://www.bacn.gov.py/leyes-paraguayas/9580/constitucion-nacional-",
    },
    {
      title: "Codigo Civil Paraguayo",
      type: LegalSourceType.CODE,
      area: "CIVIL",
      country: "Paraguay",
      content:
        "Art. 1. Las leyes son obligatorias en todo el territorio de la Republica desde el dia siguiente al de su publicacion.",
      sourceUrl: "https://www.bacn.gov.py/leyes-paraguayas/333/codigo-civil",
    },
    {
      title: "Fallo Aquino c/ Cargo Servicios Industriales",
      type: LegalSourceType.JURISPRUDENCE,
      area: "LABORAL",
      country: "Argentina",
      content:
        "La Corte Suprema reconocio la plena reparacion de danos en supuestos de accidentes de trabajo con fundamento constitucional.",
      sourceUrl: "https://sjconsulta.csjn.gov.ar/",
    },
    {
      title: "Fallo Halabi",
      type: LegalSourceType.JURISPRUDENCE,
      area: "CONSTITUCIONAL",
      country: "Argentina",
      content:
        "La Corte Suprema delimito el alcance de las acciones colectivas y la tutela de derechos de incidencia colectiva.",
      sourceUrl: "https://sjconsulta.csjn.gov.ar/",
    },
  ];

  for (const source of sources) {
    const existingSource = await prisma.legalSource.findFirst({
      where: { title: source.title },
      select: { id: true },
    });

    if (existingSource) {
      await prisma.legalSource.update({
        where: { id: existingSource.id },
        data: {
          type: source.type,
          area: source.area,
          country: source.country,
          content: source.content,
          sourceUrl: source.sourceUrl,
        },
      });
      continue;
    }

    await prisma.legalSource.create({
      data: source,
    });
  }
}

async function recreateClientCases(clientId: string, cases: SeedCase[]) {
  await prisma.case.deleteMany({ where: { clientId } });

  const legalSources = await prisma.legalSource.findMany({
    where: {
      title: {
        in: [...new Set(cases.flatMap((item) => item.sourceTitles))],
      },
    },
  });

  for (const legalCase of cases) {
    const createdCase = await prisma.case.create({
      data: {
        clientId,
        caratula: legalCase.caratula,
        code: legalCase.code,
        juzgado: legalCase.juzgado,
        description: legalCase.description,
        status: legalCase.status,
        isExtrajudicial: legalCase.isExtrajudicial,
        totalFee: legalCase.totalFee,
        driveLink: legalCase.driveLink ?? null,
        area: legalCase.area,
      },
    });

    if (legalCase.notes.length > 0) {
      await prisma.note.createMany({
        data: legalCase.notes.map((note) => ({
          caseId: createdCase.id,
          content: note.content,
          type: note.type,
        })),
      });
    }

    if (legalCase.movements.length > 0) {
      await prisma.movement.createMany({
        data: legalCase.movements.map((movement) => ({
          caseId: createdCase.id,
          title: movement.title,
          description: movement.description,
          date: daysFromNow(movement.dateOffsetDays),
        })),
      });
    }

    if (legalCase.transactions.length > 0) {
      await prisma.transaction.createMany({
        data: legalCase.transactions.map((transaction) => ({
          caseId: createdCase.id,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          date: daysFromNow(transaction.dateOffsetDays),
        })),
      });
    }

    if (legalCase.entries.length > 0) {
      await prisma.accountEntry.createMany({
        data: legalCase.entries.map((entry) => ({
          caseId: createdCase.id,
          description: entry.description,
          concept: entry.concept,
          debe: entry.debe,
          haber: entry.haber,
          date: daysFromNow(entry.dateOffsetDays),
        })),
      });
    }

    if (legalCase.events.length > 0) {
      await prisma.event.createMany({
        data: legalCase.events.map((event) => ({
          caseId: createdCase.id,
          title: event.title,
          description: event.description,
          type: event.type,
          date: daysFromNow(event.dateOffsetDays),
        })),
      });
    }

    const relatedSources = legalSources.filter((source) =>
      legalCase.sourceTitles.includes(source.title)
    );

    for (const source of relatedSources) {
      await prisma.caseLegalSource.create({
        data: {
          caseId: createdCase.id,
          legalSourceId: source.id,
        },
      });
    }
  }
}

async function seedClientsAndCases() {
  const clients: Array<{ client: SeedClient; cases: SeedCase[] }> = [
    {
      client: {
        firstName: "Laura",
        lastName: "Suarez",
        docType: "DNI",
        dni: "30111222",
        cuit: "27-30111222-4",
        nationality: "Argentina",
        phone: "3415551001",
        familyPhone: "3415559001",
        email: "laura.suarez@demo.local",
        address: "Mitre 1245",
        location: "Rosario, Santa Fe, Argentina",
        occupation: "Administrativa",
        birthPlace: "Rosario",
      },
      cases: [
        {
          caratula: "Suarez c/ Transportes del Litoral",
          code: "LAB-2026-001",
          juzgado: "Tribunal Laboral Nro. 2",
          description:
            "Despido sin causa con reclamo de diferencias salariales, horas extras e indemnizaciones.",
          status: CaseStatus.ACTIVE,
          isExtrajudicial: false,
          totalFee: 1800000,
          driveLink: "https://drive.google.com/demo/laboral-suarez",
          area: "LABORAL",
          notes: [
            {
              type: "STRATEGY",
              content:
                "Reforzar registracion deficiente y horas extras. Preparar intercambio telegrafico y pericia contable.",
            },
            {
              type: "VOICE_DRAFT",
              content:
                "Idea base para audiencia: insistir en contradiccion entre recibos y planillas internas.",
            },
          ],
          movements: [
            {
              title: "Demanda presentada",
              description: "Se promovio demanda por despido, multas y diferencias salariales.",
              dateOffsetDays: -18,
            },
            {
              title: "Traslado contestado",
              description: "La demandada nego la jornada denunciada y ofrecio testigos.",
              dateOffsetDays: -6,
            },
          ],
          transactions: [
            {
              description: "Adelanto de honorarios",
              amount: 250000,
              type: "INCOME",
              dateOffsetDays: -20,
            },
            {
              description: "Pago de bono de derecho fijo",
              amount: 18000,
              type: "EXPENSE",
              dateOffsetDays: -17,
            },
          ],
          entries: [
            {
              description: "Ingreso por adelanto de honorarios",
              concept: "Honorarios",
              debe: 0,
              haber: 250000,
              dateOffsetDays: -20,
            },
            {
              description: "Pago de bono de derecho fijo",
              concept: "Gastos judiciales",
              debe: 18000,
              haber: 0,
              dateOffsetDays: -17,
            },
          ],
          events: [
            {
              title: "Audiencia preliminar",
              description: "Revisar prueba documental y testigos.",
              type: EventType.HEARING,
              dateOffsetDays: 7,
            },
            {
              title: "Vence traslado de documental",
              description: "Subir recibos y registros horarios digitalizados.",
              type: EventType.DEADLINE,
              dateOffsetDays: 3,
            },
          ],
          sourceTitles: [
            "Constitucion de la Nacion Argentina",
            "Ley de Contrato de Trabajo Nro. 20744",
            "Fallo Aquino c/ Cargo Servicios Industriales",
          ],
        },
        {
          caratula: "Acuerdo de pago con Transportes del Litoral",
          code: "AC-2026-014",
          juzgado: "Negociacion privada con apoderado de la empresa",
          description:
            "Carpeta extrajudicial para propuesta de acuerdo previo a homologacion o cierre directo.",
          status: CaseStatus.MEDIATION,
          isExtrajudicial: true,
          totalFee: 420000,
          driveLink: "https://drive.google.com/demo/acuerdo-suarez",
          area: "ACUERDOS",
          notes: [
            {
              type: "STRATEGY",
              content:
                "Mantener piso economico y prever clausula de confidencialidad mas reconocimiento de certificados.",
            },
          ],
          movements: [
            {
              title: "Se envio propuesta inicial",
              description: "Oferta remitida a la contraparte con plan de cuotas y clausula penal.",
              dateOffsetDays: -4,
            },
          ],
          transactions: [
            {
              description: "Consulta y armado de propuesta",
              amount: 80000,
              type: "INCOME",
              dateOffsetDays: -10,
            },
          ],
          entries: [
            {
              description: "Honorarios por negociacion extrajudicial",
              concept: "Honorarios",
              debe: 0,
              haber: 80000,
              dateOffsetDays: -10,
            },
          ],
          events: [
            {
              title: "Seguimiento de propuesta",
              description: "Llamar a la contraparte y revisar respuesta.",
              type: EventType.MEETING,
              dateOffsetDays: 2,
            },
          ],
          sourceTitles: [
            "Constitucion de la Nacion Argentina",
            "Ley de Contrato de Trabajo Nro. 20744",
          ],
        },
      ],
    },
    {
      client: {
        firstName: "Carlos",
        lastName: "Benitez",
        docType: "DNI",
        dni: "28444555",
        cuit: "20-28444555-7",
        nationality: "Paraguay",
        phone: "595981555221",
        email: "carlos.benitez@demo.local",
        address: "Av. Mariscal Lopez 2200",
        location: "Asuncion, Paraguay",
        occupation: "Comerciante",
        birthPlace: "Asuncion",
      },
      cases: [
        {
          caratula: "Benitez s/ incumplimiento contractual",
          code: "CIV-PY-002",
          juzgado: "Juzgado Civil y Comercial de Asuncion",
          description:
            "Reclamo por incumplimiento de contrato de suministro y danos derivados de la falta de entrega.",
          status: CaseStatus.ACTIVE,
          isExtrajudicial: false,
          totalFee: 2400000,
          driveLink: "https://drive.google.com/demo/benitez-civil",
          area: "CIVIL",
          notes: [
            {
              type: "STRATEGY",
              content:
                "Concentrar la teoria del caso en mora, dano emergente y lucro cesante con respaldo documental.",
            },
          ],
          movements: [
            {
              title: "Mediacion frustrada",
              description: "No hubo acuerdo. Se prepara demanda principal.",
              dateOffsetDays: -14,
            },
            {
              title: "Documentacion del contrato incorporada",
              description: "Se agregan facturas, correos y carta documento.",
              dateOffsetDays: -8,
            },
          ],
          transactions: [
            {
              description: "Provision inicial de fondos",
              amount: 350000,
              type: "INCOME",
              dateOffsetDays: -15,
            },
            {
              description: "Traduccion de documentacion",
              amount: 45000,
              type: "EXPENSE",
              dateOffsetDays: -9,
            },
          ],
          entries: [
            {
              description: "Provision para inicio de demanda",
              concept: "Caja",
              debe: 0,
              haber: 350000,
              dateOffsetDays: -15,
            },
            {
              description: "Gasto por traducciones",
              concept: "Pericias y traducciones",
              debe: 45000,
              haber: 0,
              dateOffsetDays: -9,
            },
          ],
          events: [
            {
              title: "Presentacion de demanda",
              description: "Control final de documental y poder.",
              type: EventType.DEADLINE,
              dateOffsetDays: 4,
            },
            {
              title: "Reunion con cliente",
              description: "Definir monto final reclamado y estrategia probatoria.",
              type: EventType.MEETING,
              dateOffsetDays: 1,
            },
          ],
          sourceTitles: [
            "Codigo Civil Paraguayo",
            "Constitucion de la Republica del Paraguay",
          ],
        },
      ],
    },
  ];

  for (const item of clients) {
    const client = await prisma.client.upsert({
      where: { dni: item.client.dni },
      update: {
        firstName: item.client.firstName,
        lastName: item.client.lastName,
        docType: item.client.docType,
        cuit: item.client.cuit ?? null,
        nationality: item.client.nationality,
        phone: item.client.phone,
        familyPhone: item.client.familyPhone ?? null,
        email: item.client.email,
        address: item.client.address,
        location: item.client.location,
        occupation: item.client.occupation ?? null,
        birthPlace: item.client.birthPlace ?? null,
      },
      create: {
        ...item.client,
      },
    });

    await recreateClientCases(client.id, item.cases);
  }
}

async function seedGeneralAgenda() {
  await prisma.event.deleteMany({
    where: {
      caseId: null,
      title: {
        in: [
          "Control semanal del estudio",
          "Chequeo medico anual",
          "Reunion comercial con potencial cliente",
        ],
      },
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: "Control semanal del estudio",
        date: daysFromNow(1),
        type: EventType.PERSONAL,
        description: "Revisar agenda completa, caja y prioridades de la semana.",
      },
      {
        title: "Chequeo medico anual",
        date: daysFromNow(12),
        type: EventType.MEDICAL,
        description: "Turno personal para testear eventos no juridicos.",
      },
      {
        title: "Reunion comercial con potencial cliente",
        date: daysFromNow(5),
        type: EventType.SOCIAL,
        description: "Presentacion del estudio y propuesta de servicio integral.",
      },
    ],
  });
}

async function main() {
  console.log("Iniciando seed integral de prueba...");

  await seedUsers();
  await seedLegalSources();
  await seedClientsAndCases();
  await seedGeneralAgenda();

  console.log("Seed completo. Ya podes probar usuarios, clientes, expedientes, agenda, caja, contabilidad, notas y biblioteca.");
  console.log("Usuarios demo: socio@demo.local / demo1234, abogada@demo.local / demo1234, jr@demo.local / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
