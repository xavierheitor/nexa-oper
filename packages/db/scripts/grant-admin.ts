/* eslint-disable no-console */
import { PrismaClient } from '@nexa-oper/db';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const userIdArg = args.find(
    a => a.startsWith('--userId=') || a.startsWith('-u=')
  );

  if (!userIdArg) {
    throw new Error(
      'Por favor, forneça o ID do usuário usando --userId=<id> ou -u=<id>\nExemplo: npm run grant-admin -- --userId=1'
    );
  }

  const userId = Number.parseInt(userIdArg.split('=')[1], 10);

  if (Number.isNaN(userId)) {
    throw new TypeError('O ID do usuário deve ser um número válido.');
  }

  console.log(`🔍 Buscando usuário com ID: ${userId}...`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { RoleUser: { include: { role: true } }, permissionProfile: true },
  });

  if (!user) {
    throw new Error(
      `Usuário com ID ${userId} não encontrado no banco de dados.`
    );
  }

  console.log(`✅ Usuário encontrado: ${user.nome} (${user.email})`);

  // 1. Garantir que a Role "admin" exista e associar ao usuário
  let adminRole = await prisma.role.findFirst({
    where: { nome: 'admin' },
  });

  if (!adminRole) {
    console.log('⚠️ Role "admin" não encontrada. Criando...');
    adminRole = await prisma.role.create({
      data: {
        nome: 'admin',
        createdBy: 'system-script',
      },
    });
  }

  const hasAdminRole = user.RoleUser.some(
    (ru: { role: { nome: string } }) => ru.role.nome === 'admin'
  );

  if (!hasAdminRole) {
    console.log('🔄 Adicionando Role "admin" ao usuário...');
    await prisma.roleUser.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
  } else {
    console.log('ℹ️ Usuário já possui a Role "admin".');
  }

  // 2. Garantir que o PermissionProfile "admin" exista e associar
  let adminProfile = await prisma.permissionProfile.findUnique({
    where: { key: 'admin' },
  });

  if (!adminProfile) {
    console.log('⚠️ PermissionProfile "admin" não encontrado. Criando...');
    adminProfile = await prisma.permissionProfile.create({
      data: {
        key: 'admin',
        nome: 'Administrador do Sistema',
        descricao: 'Acesso total ao sistema (Gerado via script)',
        ativo: true,
        createdBy: 'system-script',
      },
    });
  }

  if (user.permissionProfileId !== adminProfile.id) {
    console.log('🔄 Associando PermissionProfile "admin" ao usuário...');
    await prisma.user.update({
      where: { id: user.id },
      data: { permissionProfileId: adminProfile.id },
    });
  } else {
    console.log('ℹ️ Usuário já possui o perfil de permissão "admin".');
  }

  console.log(
    `🎉 Sucesso! O usuário '${user.nome}' agora tem permissões de administrador total.`
  );
}

main()
  .catch(error => {
    console.error('❌ Ocorreu um erro durante a execução:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect().catch((error) => {
      console.error(error);
    });
  });
