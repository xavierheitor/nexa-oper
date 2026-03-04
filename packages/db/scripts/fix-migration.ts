import mysql from 'mysql2/promise';

async function main() {

  // Use the connection string from environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const url = new URL(databaseUrl);
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: parseInt(url.port || '3306')
  });

  try {
     console.log('Disabling foreign key checks manually for migration fix...');
     await connection.execute('SET FOREIGN_KEY_CHECKS=0;');

     console.log('Attempting to drop problematic indexes if they exist...');
     try {
       await connection.execute('DROP INDEX `TipoAtividade_nome_idx` ON `TipoAtividade`');
       console.log('Dropped TipoAtividade_nome_idx');
     } catch(e) { console.log('Index TipoAtividade_nome_idx drop failed or already dropped'); }

     try {
       await connection.execute('DROP INDEX `TipoAtividade_nome_key` ON `TipoAtividade`');
       console.log('Dropped TipoAtividade_nome_key');
     } catch(e) { console.log('Index TipoAtividade_nome_key drop failed or already dropped'); }

     console.log('Fixing Prisma migration history...');
     // Mark it as applied manually so we can skip this problematic step since it's already midway through
     // But wait, if we mark it as applied, the rest of the migration won't run.
     // We should actually let prisma deploy it, but it fails on the first step.
     // To fix Prisma failing on DROP INDEX that doesn't exist, we can CREATE the index temporarily!
     
     console.log('Creating dummy indexes so Prisma can drop them...');
     try {
       await connection.execute('CREATE INDEX `TipoAtividade_nome_idx` ON `TipoAtividade`(`nome`);');
       console.log('Created dummy TipoAtividade_nome_idx');
     } catch(e: any) { console.log('Failed to create dummy index: ' + e.message); }

     try {
       await connection.execute('CREATE UNIQUE INDEX `TipoAtividade_nome_key` ON `TipoAtividade`(`nome`);');
       console.log('Created dummy TipoAtividade_nome_key');
     } catch(e: any) { console.log('Failed to create dummy index: ' + e.message); }

     await connection.execute('SET FOREIGN_KEY_CHECKS=1;');
     console.log('Done fixing indexes. You can now run prisma migrate deploy.');
  } catch (error) {
    console.error('Error executing update:', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
