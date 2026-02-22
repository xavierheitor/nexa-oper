import { PrismaClient } from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(
    `CREATE DATABASE IF NOT EXISTS nexa_pse_temp;`
  );
  console.log('Successfully created temp DB');
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
