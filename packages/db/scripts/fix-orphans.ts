import mysql from 'mysql2/promise';

async function main() {
  const contratoId = process.argv[2];

  if (!contratoId) {
    console.error('Please provide a contratoId as the first argument');
    process.exit(1);
  }

  console.log(`Updating orphaned TipoAtividade records with contratoId: ${contratoId}`);

  // Use the connection string from environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // mysql2 requires different format than prisma connection string sometimes, 
  // but we can try parsing the URL
  const url = new URL(databaseUrl);
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: parseInt(url.port || '3306')
  });

  try {
    const [result] = await connection.execute(
      `UPDATE TipoAtividade SET contratoId = ? WHERE contratoId NOT IN (SELECT id FROM Contrato)`,
      [contratoId]
    );

    console.log(`Updated records successfully`, result);
  } catch (error) {
    console.error('Error executing update:', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
