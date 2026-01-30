const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10); // 👈 Esta será tu contraseña

  const user = await db.user.upsert({
    where: { email: "admin@legal.com" },
    update: {},
    create: {
      email: "admin@legal.com",
      name: "Abogado Principal",
      password: password,
    },
  });

  console.log({ user });
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });