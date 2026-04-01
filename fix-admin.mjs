import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = "admin123"
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@legal.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email: 'admin@legal.com',
      name: 'Admin Estudio',
      password: hashedPassword,
      role: 'ADMIN'
    },
  })
  
  console.log('✅ Usuario Admin actualizado/creado con éxito:', user.email)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())