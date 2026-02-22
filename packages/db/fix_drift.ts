import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '0_init';`);
  console.log('Deleted 0_init from _prisma_migrations');
}
main().catch(console.error).finally(() => prisma.$disconnect());
