import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 LIMPIANDO BASE DE DATOS...')
  
  // 1. Limpieza profunda (Orden estricto para evitar errores de claves foráneas)
  await prisma.transaction.deleteMany()
  await prisma.event.deleteMany()
  await prisma.movement.deleteMany()
  await prisma.case.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Limpieza completada.')

  // ----------------------------------------------------------------------
  // 1. USUARIO ADMIN
  // ----------------------------------------------------------------------
  const password = await bcrypt.hash("admin123", 10)
  
  await prisma.user.create({
    data: {
      email: "admin@legal.com",
      name: "Dr. Admin",
      password: password,
      role: "ADMIN"
    }
  })
  console.log('👤 Usuario Admin creado (admin@legal.com / admin123)')

  // ----------------------------------------------------------------------
  // 2. CLIENTES (Personas y Empresas)
  // ----------------------------------------------------------------------
  const clienteMessi = await prisma.client.create({
    data: {
      firstName: 'Lionel Andrés',
      lastName: 'Messina',
      email: 'leomessina@mail.com',
      phone: '341-111-2222',
      docType: 'DNI',
      dni: '30.000.111',
      address: 'Av. Del Huerto 1200',
      location: 'Rosario',
      occupation: 'Jugador Profesional',
    }
  })

  const clienteEmpresa = await prisma.client.create({
    data: {
      firstName: 'Constructora',
      lastName: 'Del Litoral S.R.L.',
      email: 'admin@litoral.com.ar',
      phone: '342-455-6677',
      docType: 'CUIT',
      cuit: '30-70707070-1',
      address: 'Parque Industrial Sauce Viejo',
      location: 'Santa Fe Capital',
      occupation: 'Construcción',
    }
  })

  const clienteSucesion = await prisma.client.create({
    data: {
      firstName: 'Marta',
      lastName: 'Legrand',
      email: 'marta@diva.com',
      phone: '341-999-8888',
      docType: 'DNI',
      dni: '5.444.333',
      address: 'Bv. Oroño 500',
      location: 'Rosario',
      occupation: 'Jubilada',
    }
  })

  // ----------------------------------------------------------------------
  // 3. EXPEDIENTES Y DETALLES
  // ----------------------------------------------------------------------

  // CASO 1: CIVIL - Daños y Perjuicios (El caso grande)
  await prisma.case.create({
    data: {
      code: '21-00004567-8',
      caratula: 'MESSINA, LIONEL c/ ASEGURADORA FEDERAL s/ DAÑOS Y PERJUICIOS',
      juzgado: 'Juzgado Civil y Comercial 12° Nom. Rosario',
      area: 'CIVIL',
      status: 'ACTIVE',
      totalFee: 5900000, // Honorarios estimados grandes
      description: 'Accidente de tránsito en Circunvalación. Lesiones graves y destrucción total.',
      driveLink: 'https://sisfe.justiciasantafe.gov.ar/',
      clientId: clienteMessi.id,
      
      // MOVIMIENTOS (Historial)
      movements: {
        create: [
          { title: 'Interposición de Demanda', description: 'Se presentó demanda por mesa de entradas.', date: new Date('2025-08-10') },
          { title: 'Primer Decreto', description: 'Téngase por presentado, por parte y domiciliado.', date: new Date('2025-08-15') },
          { title: 'Cédula Diligenciada', description: 'Notificación exitosa a la aseguradora.', date: new Date('2025-09-01') },
          { title: 'Contestación de Demanda', description: 'La demandada niega los hechos y ofrece prueba.', date: new Date('2025-09-20') },
          { title: 'Apertura a Prueba', description: 'Se abre la causa a prueba por el término de ley.', date: new Date('2025-10-05') },
        ]
      },
      
      // AGENDA (Eventos pasados y FUTUROS para que salten alertas)
      events: {
        create: [
          { title: 'Audiencia Art. 51', type: 'HEARING', date: new Date('2025-11-20'), description: 'Audiencia preliminar (Realizada)', isDone: true },
          { title: 'Pericia Mecánica', type: 'MEETING', date: new Date('2026-02-15'), description: 'Asistir con el perito al lugar del hecho', isDone: false },
          { title: 'Vencimiento Período Probatorio', type: 'DEADLINE', date: new Date('2026-03-01'), description: 'Último día para presentar alegatos !!', isDone: false }, // ESTO SALDRÁ EN ROJO
        ]
      },

      // FINANZAS (Para que el dashboard sume dinero)
      transactions: {
        create: [
          { amount: 250000, type: 'INCOME', description: 'Adelanto de Honorarios (Efectivo)', date: new Date('2025-08-10') },
          { amount: 50000, type: 'EXPENSE', description: 'Bono Ley y Sellado', date: new Date('2025-08-12') },
          { amount: 15000, type: 'EXPENSE', description: 'Gastos de Movilidad', date: new Date('2025-09-01') },
          { amount: 500000, type: 'INCOME', description: 'Pago a cuenta (Transferencia)', date: new Date('2026-01-10') },
        ]
      }
    }
  })

  // CASO 2: LABORAL - Despido (Defensa de empresa)
  await prisma.case.create({
    data: {
      code: '44-12341234-9',
      caratula: 'GOMEZ, JORGE c/ CONSTRUCTORA DEL LITORAL s/ COBRO DE PESOS',
      juzgado: 'Juzgado Laboral 4ta. Nom. Santa Fe',
      area: 'LABORAL',
      status: 'MEDIATION',
      totalFee: 1500000,
      description: 'Reclamo por despido indirecto. Posible acuerdo en Ministerio de Trabajo.',
      clientId: clienteEmpresa.id,
      
      movements: {
        create: [
          { title: 'Telegrama Recibido', description: 'Empleado se considera despedido.', date: new Date('2025-12-01') },
          { title: 'Audiencia Ministerio Trabajo', description: 'Fijada fecha para conciliación administrativa.', date: new Date('2026-01-15') },
        ]
      },

      events: {
        create: [
          { title: 'Audiencia Conciliación', type: 'HEARING', date: new Date('2026-02-20'), description: 'Llevar propuesta de pago en cuotas', isDone: false },
        ]
      },

      transactions: {
        create: [
          { amount: 80000, type: 'INCOME', description: 'Consulta y redacción carta documento', date: new Date('2025-12-02') },
        ]
      }
    }
  })

  // CASO 3: FAMILIA - Sucesión (Tranquilo)
  await prisma.case.create({
    data: {
      code: '55-99887766-1',
      caratula: 'LEGRAND, MIRTHA s/ SUCESORIO',
      juzgado: 'Tribunal Colegiado de Familia N° 2',
      area: 'FAMILIA',
      status: 'ACTIVE',
      totalFee: 8500000, // Sucesión grande
      description: 'Sucesión con múltiples bienes inmuebles en Rosario y Funes.',
      clientId: clienteSucesion.id,
      
      movements: {
        create: [
          { title: 'Solicitud de Inicio', description: 'Se presenta partida de defunción.', date: new Date('2026-01-01') },
          { title: 'Oficio al Registro Testamentos', description: 'Diligenciado.', date: new Date('2026-01-10') },
        ]
      },

      events: {
        create: [
          { title: 'Declaratoria de Herederos', type: 'DEADLINE', date: new Date('2026-04-10'), description: 'Fecha estimada para pedir declaratoria', isDone: false },
        ]
      },
      
      transactions: {
        create: [
          { amount: 120000, type: 'EXPENSE', description: 'Publicación Edictos', date: new Date('2026-01-20') },
          { amount: 1500000, type: 'INCOME', description: 'Honorarios Iniciales', date: new Date('2026-01-05') },
        ]
      }
    }
  })

  // CASO 4: PENAL (Para mostrar variedad)
  await prisma.case.create({
    data: {
      code: '22-55555555-0',
      caratula: 'MPA c/ MESSINA, LIONEL s/ LESIONES CULPOSAS',
      juzgado: 'Ministerio Público de la Acusación',
      area: 'PENAL',
      status: 'ACTIVE',
      totalFee: 1000000,
      description: 'Causa penal derivada del accidente de tránsito.',
      clientId: clienteMessi.id, // Mismo cliente, otra causa
      
      movements: {
        create: [
          { title: 'Audiencia Imputativa', description: 'Lectura de derechos e imputación.', date: new Date('2026-01-20') },
        ]
      },
      events: {
        create: [
          { title: 'Presentación Descargo', type: 'DEADLINE', date: new Date('2026-02-28'), description: 'Presentar escrito defensa técnica', isDone: false },
        ]
      }
    }
  })

  console.log('🚀 CARGA DE DATOS COMPLETADA CON ÉXITO')
  console.log('Ahora tenés Clientes, Casos, Movimientos, Agenda y Finanzas listos.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })