#!/usr/bin/env node

/**
 * Script para limpeza de porta antes da inicialização
 *
 * Este script verifica se a porta 3001 está em uso e a libera
 * antes de iniciar a aplicação, evitando conflitos no watch mode.
 *
 * @author Nexa Oper Team
 * @since 1.0.0
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Verifica se a porta está em uso
 * @param {number} port - Porta a ser verificada
 * @returns {Promise<boolean>} True se a porta estiver em uso
 */
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim().length > 0;
  } catch (error) {
    // Se não encontrar processos, a porta está livre
    return false;
  }
}

/**
 * Mata processos que estão usando a porta
 * @param {number} port - Porta a ser liberada
 */
async function killPortProcesses(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(pid => pid.length > 0);

    if (pids.length > 0) {
      console.log(`🔄 Encontrados ${pids.length} processo(s) usando a porta ${port}`);

      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          console.log(`✅ Processo ${pid} finalizado`);
        } catch (error) {
          console.log(`⚠️  Erro ao finalizar processo ${pid}:`, error.message);
        }
      }

      // Aguardar um pouco para garantir que a porta foi liberada
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.log(`ℹ️  Nenhum processo encontrado na porta ${port}`);
  }
}

/**
 * Função principal
 */
async function main() {
  const port = process.env.PORT || 3001;

  console.log(`🔍 Verificando porta ${port}...`);

  if (await isPortInUse(port)) {
    console.log(`⚠️  Porta ${port} está em uso. Liberando...`);
    await killPortProcesses(port);

    // Verificar novamente
    if (await isPortInUse(port)) {
      console.log(`❌ Falha ao liberar porta ${port}`);
      process.exit(1);
    } else {
      console.log(`✅ Porta ${port} liberada com sucesso`);
    }
  } else {
    console.log(`✅ Porta ${port} está livre`);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro no script de limpeza:', error);
    process.exit(1);
  });
}

module.exports = { isPortInUse, killPortProcesses };
