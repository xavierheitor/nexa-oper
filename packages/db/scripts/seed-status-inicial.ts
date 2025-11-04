/**
 * Script de Seed: Status Inicial de Eletricistas
 *
 * Este script popula o status inicial (ATIVO) para todos os eletricistas
 * que já existem no banco de dados, mas não possuem registro de status.
 *
 * USO:
 *   npx ts-node packages/db/scripts/seed-status-inicial.ts
 *
 * OU:
 *   npm run seed:status (se configurado no package.json)
 */

import { PrismaClient, StatusEletricista } from '../generated/prisma';

const prisma = new PrismaClient();

async function seedStatusInicial() {
  console.log('🌱 Iniciando seed de status inicial...');
  console.log('📅 Data/Hora:', new Date().toISOString());

  try {
    // Buscar todos os eletricistas que não têm status
    const eletricistasSemStatus = await prisma.eletricista.findMany({
      where: {
        Status: null,
        deletedAt: null, // Apenas não deletados
      },
      select: {
        id: true,
        nome: true,
        matricula: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    console.log(`📊 Encontrados ${eletricistasSemStatus.length} eletricistas sem status`);

    if (eletricistasSemStatus.length === 0) {
      console.log('✅ Todos os eletricistas já têm status. Nada a fazer.');
      return;
    }

    console.log('\n📝 Criando status inicial para os eletricistas...\n');

    let sucesso = 0;
    let erros = 0;

    // Criar status inicial para cada eletricista
    for (const eletricista of eletricistasSemStatus) {
      try {
        const agora = new Date();
        const dataInicio = eletricista.createdAt || agora;
        const createdBy = eletricista.createdBy || 'system';

        // Criar status atual
        await prisma.eletricistaStatus.create({
          data: {
            eletricistaId: eletricista.id,
            status: StatusEletricista.ATIVO,
            dataInicio,
            motivo: 'Status inicial - eletricista já existente no banco',
            observacoes: 'Status criado automaticamente durante migration',
            createdBy,
          },
        });

        // Criar registro no histórico
        await prisma.eletricistaStatusHistorico.create({
          data: {
            eletricistaId: eletricista.id,
            status: StatusEletricista.ATIVO,
            statusAnterior: null,
            dataInicio,
            dataFim: null,
            motivo: 'Status inicial - eletricista já existente no banco',
            observacoes: 'Status criado automaticamente durante migration',
            registradoPor: createdBy,
            registradoEm: agora,
            createdBy,
          },
        });

        console.log(
          `✅ [${sucesso + 1}/${eletricistasSemStatus.length}] Status criado para eletricista ID ${eletricista.id} - ${eletricista.nome} (${eletricista.matricula})`
        );
        sucesso++;
      } catch (error: any) {
        console.error(
          `❌ Erro ao criar status para eletricista ${eletricista.id} (${eletricista.nome}):`,
          error.message
        );
        erros++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Seed concluído!`);
    console.log(`✅ Sucesso: ${sucesso}`);
    if (erros > 0) {
      console.log(`❌ Erros: ${erros}`);
    }
    console.log('='.repeat(60));

    // Verificação final
    const totalComStatus = await prisma.eletricistaStatus.count();
    const totalEletricistas = await prisma.eletricista.count({
      where: { deletedAt: null },
    });

    console.log(`\n📊 Estatísticas finais:`);
    console.log(`   Total de eletricistas (não deletados): ${totalEletricistas}`);
    console.log(`   Total com status: ${totalComStatus}`);
    console.log(`   Cobertura: ${((totalComStatus / totalEletricistas) * 100).toFixed(2)}%`);

    if (totalComStatus < totalEletricistas) {
      console.log(
        `\n⚠️  Atenção: Ainda há ${totalEletricistas - totalComStatus} eletricistas sem status.`
      );
    } else {
      console.log(`\n✅ Todos os eletricistas têm status!`);
    }
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedStatusInicial()
    .then(() => {
      console.log('\n✅ Seed finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no seed:', error);
      process.exit(1);
    });
}

export { seedStatusInicial };

