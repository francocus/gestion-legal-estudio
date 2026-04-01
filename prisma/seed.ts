import { LegalSourceType, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando la plantación de leyes en la base de datos...")

  const leyes = [
    // --- ARGENTINA ---
    { title: "Constitución de la Nación Argentina", type: "CONSTITUTION", area: "CONSTITUCIONAL", country: "Argentina", content: "Art. 14 bis.- El trabajo en sus diversas formas gozará de la protección de las leyes, las que asegurarán al trabajador: condiciones dignas y equitativas de labor, jornada limitada; descanso y vacaciones pagados..." },
    { title: "Código Civil y Comercial de la Nación", type: "CODE", area: "CIVIL", country: "Argentina", content: "Art. 1.- Fuentes y aplicación. Los casos que este Código rige deben ser resueltos según las leyes que resulten aplicables, conforme con la Constitución Nacional y los tratados de derechos humanos en los que la República sea parte." },
    { title: "Código Penal de la Nación Argentina", type: "CODE", area: "PENAL", country: "Argentina", content: "Art. 79.- Se aplicará reclusión o prisión de ocho a veinticinco años, al que matare a otro siempre que en este código no se estableciere otra pena." },
    { title: "Ley de Contrato de Trabajo N° 20.744", type: "LAW", area: "LABORAL", country: "Argentina", content: "Art. 21.- Contrato de trabajo. Habrá contrato de trabajo, cualquiera sea su forma o denominación, siempre que una persona física se obligue a realizar actos, ejecutar obras o prestar servicios en favor de la otra y bajo la dependencia de ésta..." },
    { title: "Ley de Defensa del Consumidor N° 24.240", type: "LAW", area: "COMERCIAL", country: "Argentina", content: "Art. 4º — Información. El proveedor está obligado a suministrar al consumidor en forma cierta, clara y detallada todo lo relacionado con las características esenciales de los bienes y servicios que provee..." },
    
    // --- PARAGUAY ---
    { title: "Constitución de la República del Paraguay", type: "CONSTITUTION", area: "CONSTITUCIONAL", country: "Paraguay", content: "Art. 1.- De la forma del Estado y de Gobierno. La República del Paraguay es para siempre libre e independiente. Se constituye en Estado social de derecho, unitario, indivisible, y descentralizado..." },
    { title: "Código Civil Paraguayo (Ley N° 1183/85)", type: "CODE", area: "CIVIL", country: "Paraguay", content: "Art. 1.- Las leyes son obligatorias en todo el territorio de la República desde el día siguiente al de su publicación, o desde el día que ellas determinen." },
    { title: "Código Penal del Paraguay (Ley N° 1160/97)", type: "CODE", area: "PENAL", country: "Paraguay", content: "Art. 1.- Principio de legalidad. Nadie será sancionado con una pena o medida sin que los presupuestos de la punibilidad de la conducta y la sanción aplicable se hallen expresa y estrictamente determinados en una ley..." },
    { title: "Código del Trabajo (Ley N° 213/93)", type: "CODE", area: "LABORAL", country: "Paraguay", content: "Art. 1.- Este Código rige las relaciones de trabajo entre los trabajadores y empleadores, entendiéndose por tal, toda persona que en virtud de un contrato presta servicios o ejecuta una obra para otro..." }
  ];

  for (const ley of leyes) {
    // Usamos el tipo "any" temporalmente por la estructura de Next.js
    await prisma.legalSource.create({
      data: {
        title: ley.title,
        type: ley.type as LegalSourceType,
        area: ley.area,
        country: ley.country,
        content: ley.content,
      }
    });
  }
  
  console.log("✅ ¡Biblioteca jurídica poblada con éxito! Se cargaron 9 leyes fundamentales.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
