import { PrismaClient } from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS nexa_pse_temp_shadow;`);
  console.log('Successfully created temp shadow DB');
}
main().catch(console.error).finally(() => prisma.$disconnect());
