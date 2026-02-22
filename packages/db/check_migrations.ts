import { PrismaClient } from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(
    `DELETE FROM _prisma_migrations WHERE migration_name = '0_init';`
  );
  console.log('Successfully deleted 0_init');
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
