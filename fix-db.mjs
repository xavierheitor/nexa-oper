import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.DATABASE_URL;
if (url) {
  url = url.replace(/^"|"$|'/g, ''); // strip quotes
}

if (!url) {
  console.error("No DATABASE_URL found.");
  process.exit(1);
}

async function fix() {
  const connection = await mysql.createConnection(url);
  try {
    console.log("Connected. Creating MobileAppVersion table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`MobileAppVersion\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`versao\` VARCHAR(50) NOT NULL,
        \`plataforma\` VARCHAR(20) NOT NULL DEFAULT 'android',
        \`notas\` TEXT NULL,
        \`arquivoUrl\` VARCHAR(1024) NOT NULL,
        \`ativo\` BOOLEAN NOT NULL DEFAULT false,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Success! The table was created.");
    
    // Add it to Prisma's migration table so it doesn't try to create it later if they fix the sha256 bug
    await connection.execute(`
      INSERT IGNORE INTO \`_prisma_migrations\` (\`id\`, \`checksum\`, \`bytes\`, \`applied_steps_count\`, \`migration_name\`, \`logs\`, \`applied_steps_count_resolved\`, \`started_at\`, \`finished_at\`) 
      VALUES (uuid(), 'bypass-checksum', 0, 1, 'add_mobile_app_version', NULL, 1, NOW(), NOW())
    `);
    console.log("Marked as migrated in _prisma_migrations.");

  } catch (err) {
    console.error("Error creating table:", err.message);
  } finally {
    await connection.end();
  }
}

fix();
