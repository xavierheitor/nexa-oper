import { PrismaClient } from '@nexa-oper/db';

const prisma = new PrismaClient();

// Helper para criar dados de auditoria
const auditData = {
  createdAt: new Date(),
  createdBy: 'seed-script',
  updatedAt: new Date(),
  updatedBy: 'seed-script',
};

// Helper para gerar UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper para gerar datas
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getToday(): Date {
  return new Date();
}

function getDateAtTime(date: Date, hours: number, minutes: number = 0): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ============================================
  // 1. CONTRATOS
  // ============================================
  console.log('📋 Criando contratos...');
  const contrato1 = await prisma.contrato.create({
    data: {
      nome: 'Contrato Norte',
      numero: 'CN-2024-001',
      dataInicio: addDays(getToday(), -365),
      dataFim: addDays(getToday(), 365),
      ...auditData,
    },
  });

  const contrato2 = await prisma.contrato.create({
    data: {
      nome: 'Contrato Sul',
      numero: 'CS-2024-002',
      dataInicio: addDays(getToday(), -180),
      dataFim: addDays(getToday(), 545),
      ...auditData,
    },
  });

  // ============================================
  // 2. BASES
  // ============================================
  console.log('🏢 Criando bases...');
  const base1 = await prisma.base.create({
    data: {
      nome: 'Base Norte',
      contratoId: contrato1.id,
      ...auditData,
    },
  });

  const base2 = await prisma.base.create({
    data: {
      nome: 'Base Sul',
      contratoId: contrato2.id,
      ...auditData,
    },
  });

  // ============================================
  // 3. CARGOS
  // ============================================
  console.log('👔 Criando cargos...');
  const cargo1 = await prisma.cargo.create({
    data: {
      nome: 'Eletricista de Linha',
      salarioBase: 3500.0,
      ...auditData,
    },
  });

  const cargo2 = await prisma.cargo.create({
    data: {
      nome: 'Eletricista de Rede',
      salarioBase: 3800.0,
      ...auditData,
    },
  });

  const cargo3 = await prisma.cargo.create({
    data: {
      nome: 'Eletricista Sênior',
      salarioBase: 4500.0,
      ...auditData,
    },
  });

  // ============================================
  // 4. TIPOS DE VEÍCULO E EQUIPE
  // ============================================
  console.log('🚗 Criando tipos de veículo...');
  const tipoVeiculo1 = await prisma.tipoVeiculo.create({
    data: {
      nome: 'Caminhão',
      ...auditData,
    },
  });

  const tipoVeiculo2 = await prisma.tipoVeiculo.create({
    data: {
      nome: 'Van',
      ...auditData,
    },
  });

  console.log('👥 Criando tipos de equipe...');
  const tipoEquipe1 = await prisma.tipoEquipe.create({
    data: {
      nome: 'Equipe de Manutenção',
      ...auditData,
    },
  });

  const tipoEquipe2 = await prisma.tipoEquipe.create({
    data: {
      nome: 'Equipe de Instalação',
      ...auditData,
    },
  });

  // ============================================
  // 5. VEÍCULOS
  // ============================================
  console.log('🚛 Criando veículos...');
  const veiculos = [];
  const placas = ['ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890'];
  for (let i = 0; i < 5; i++) {
    const veiculo = await prisma.veiculo.create({
      data: {
        placa: placas[i],
        modelo: i < 3 ? 'Caminhão Mercedes' : 'Van Fiat',
        ano: 2020 + (i % 3),
        tipoVeiculoId: i < 3 ? tipoVeiculo1.id : tipoVeiculo2.id,
        contratoId: i < 3 ? contrato1.id : contrato2.id,
        ...auditData,
      },
    });
    veiculos.push(veiculo);
  }

  // ============================================
  // 6. EQUIPES
  // ============================================
  console.log('👷 Criando equipes...');
  const equipe1 = await prisma.equipe.create({
    data: {
      nome: 'Equipe Alfa',
      tipoEquipeId: tipoEquipe1.id,
      contratoId: contrato1.id,
      ...auditData,
    },
  });

  const equipe2 = await prisma.equipe.create({
    data: {
      nome: 'Equipe Beta',
      tipoEquipeId: tipoEquipe1.id,
      contratoId: contrato1.id,
      ...auditData,
    },
  });

  const equipe3 = await prisma.equipe.create({
    data: {
      nome: 'Equipe Gama',
      tipoEquipeId: tipoEquipe2.id,
      contratoId: contrato2.id,
      ...auditData,
    },
  });

  // ============================================
  // 7. SUPERVISORES
  // ============================================
  console.log('👨‍💼 Criando supervisores...');
  const supervisor1 = await prisma.supervisor.create({
    data: {
      nome: 'João Silva',
      contratoId: contrato1.id,
      ...auditData,
    },
  });

  const supervisor2 = await prisma.supervisor.create({
    data: {
      nome: 'Maria Santos',
      contratoId: contrato2.id,
      ...auditData,
    },
  });

  // Associar supervisores às equipes
  await prisma.equipeSupervisor.create({
    data: {
      equipeId: equipe1.id,
      supervisorId: supervisor1.id,
      inicio: addDays(getToday(), -90),
      ...auditData,
    },
  });

  await prisma.equipeSupervisor.create({
    data: {
      equipeId: equipe2.id,
      supervisorId: supervisor1.id,
      inicio: addDays(getToday(), -60),
      ...auditData,
    },
  });

  await prisma.equipeSupervisor.create({
    data: {
      equipeId: equipe3.id,
      supervisorId: supervisor2.id,
      inicio: addDays(getToday(), -30),
      ...auditData,
    },
  });

  // ============================================
  // 8. ELETRICISTAS
  // ============================================
  console.log('⚡ Criando eletricistas...');
  const eletricistas = [];
  const nomes = [
    'Carlos Oliveira',
    'Ana Costa',
    'Pedro Almeida',
    'Juliana Lima',
    'Roberto Souza',
    'Fernanda Rocha',
    'Lucas Pereira',
    'Mariana Ferreira',
    'Ricardo Gomes',
    'Patricia Martins',
  ];
  const estados = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE'];

  for (let i = 0; i < 10; i++) {
    const eletricista = await prisma.eletricista.create({
      data: {
        nome: nomes[i],
        matricula: `MAT${String(i + 1).padStart(4, '0')}`,
        telefone: `1198765${String(i).padStart(4, '0')}`,
        estado: estados[i],
        admissao: addDays(getToday(), -(365 + i * 30)),
        cargoId: i < 3 ? cargo1.id : i < 7 ? cargo2.id : cargo3.id,
        contratoId: i < 5 ? contrato1.id : contrato2.id,
        ...auditData,
      },
    });
    eletricistas.push(eletricista);
  }

  // ============================================
  // 9. TIPOS DE ATIVIDADE E APR
  // ============================================
  console.log('📝 Criando tipos de atividade...');
  const tipoAtividade1 = await prisma.tipoAtividade.create({
    data: {
      nome: 'Manutenção Preventiva',
      ...auditData,
    },
  });

  const tipoAtividade2 = await prisma.tipoAtividade.create({
    data: {
      nome: 'Instalação de Rede',
      ...auditData,
    },
  });

  const tipoAtividade3 = await prisma.tipoAtividade.create({
    data: {
      nome: 'Reparo de Emergência',
      ...auditData,
    },
  });

  console.log('📋 Criando APRs...');
  const apr1 = await prisma.apr.create({
    data: {
      nome: 'APR Manutenção Preventiva',
      ...auditData,
    },
  });

  const apr2 = await prisma.apr.create({
    data: {
      nome: 'APR Instalação',
      ...auditData,
    },
  });

  // Relacionar APRs com tipos de atividade
  await prisma.aprTipoAtividadeRelacao.create({
    data: {
      aprId: apr1.id,
      tipoAtividadeId: tipoAtividade1.id,
      ...auditData,
    },
  });

  await prisma.aprTipoAtividadeRelacao.create({
    data: {
      aprId: apr2.id,
      tipoAtividadeId: tipoAtividade2.id,
      ...auditData,
    },
  });

  // Criar perguntas e opções de resposta para APRs
  const aprPergunta1 = await prisma.aprPergunta.create({
    data: {
      nome: 'Equipamentos de proteção individual estão sendo utilizados?',
      ...auditData,
    },
  });

  const aprPergunta2 = await prisma.aprPergunta.create({
    data: {
      nome: 'Área de trabalho está sinalizada?',
      ...auditData,
    },
  });

  await prisma.aprPerguntaRelacao.create({
    data: {
      aprId: apr1.id,
      aprPerguntaId: aprPergunta1.id,
      ordem: 1,
      ...auditData,
    },
  });

  await prisma.aprPerguntaRelacao.create({
    data: {
      aprId: apr1.id,
      aprPerguntaId: aprPergunta2.id,
      ordem: 2,
      ...auditData,
    },
  });

  // ============================================
  // 10. CHECKLISTS
  // ============================================
  console.log('✅ Criando checklists...');
  const tipoChecklist1 = await prisma.tipoChecklist.create({
    data: {
      nome: 'Checklist de Veículo',
      ...auditData,
    },
  });

  const tipoChecklist2 = await prisma.tipoChecklist.create({
    data: {
      nome: 'Checklist de Equipamentos',
      ...auditData,
    },
  });

  const checklist1 = await prisma.checklist.create({
    data: {
      nome: 'Checklist Diário de Veículo',
      tipoChecklistId: tipoChecklist1.id,
      ...auditData,
    },
  });

  const checklist2 = await prisma.checklist.create({
    data: {
      nome: 'Checklist de Equipamentos de Segurança',
      tipoChecklistId: tipoChecklist2.id,
      ...auditData,
    },
  });

  // Relacionar checklists com tipos de veículo e equipe
  await prisma.checklistTipoVeiculoRelacao.create({
    data: {
      checklistId: checklist1.id,
      tipoVeiculoId: tipoVeiculo1.id,
      ...auditData,
    },
  });

  await prisma.checklistTipoEquipeRelacao.create({
    data: {
      checklistId: checklist2.id,
      tipoEquipeId: tipoEquipe1.id,
      tipoChecklistId: tipoChecklist2.id,
      ...auditData,
    },
  });

  // Criar perguntas e opções de resposta
  const pergunta1 = await prisma.checklistPergunta.create({
    data: {
      nome: 'Nível de óleo está adequado?',
      ...auditData,
    },
  });

  const pergunta2 = await prisma.checklistPergunta.create({
    data: {
      nome: 'Pneus estão em bom estado?',
      ...auditData,
    },
  });

  const pergunta3 = await prisma.checklistPergunta.create({
    data: {
      nome: 'Equipamentos de segurança estão presentes?',
      ...auditData,
    },
  });

  await prisma.checklistPerguntaRelacao.create({
    data: {
      checklistId: checklist1.id,
      checklistPerguntaId: pergunta1.id,
      ...auditData,
    },
  });

  await prisma.checklistPerguntaRelacao.create({
    data: {
      checklistId: checklist1.id,
      checklistPerguntaId: pergunta2.id,
      ...auditData,
    },
  });

  await prisma.checklistPerguntaRelacao.create({
    data: {
      checklistId: checklist2.id,
      checklistPerguntaId: pergunta3.id,
      ...auditData,
    },
  });

  const opcaoSim = await prisma.checklistOpcaoResposta.create({
    data: {
      nome: 'Sim',
      geraPendencia: false,
      ...auditData,
    },
  });

  const opcaoNao = await prisma.checklistOpcaoResposta.create({
    data: {
      nome: 'Não',
      geraPendencia: true,
      ...auditData,
    },
  });

  await prisma.checklistOpcaoRespostaRelacao.create({
    data: {
      checklistId: checklist1.id,
      checklistOpcaoRespostaId: opcaoSim.id,
      ...auditData,
    },
  });

  await prisma.checklistOpcaoRespostaRelacao.create({
    data: {
      checklistId: checklist1.id,
      checklistOpcaoRespostaId: opcaoNao.id,
      ...auditData,
    },
  });

  // ============================================
  // 11. TIPOS DE ESCALA E ESCALAS
  // ============================================
  console.log('📅 Criando tipos de escala...');
  const tipoEscala1 = await prisma.tipoEscala.create({
    data: {
      nome: 'Escala 4x2',
      modoRepeticao: 'CICLO_DIAS',
      cicloDias: 6,
      eletricistasPorTurma: 4,
      ativo: true,
      ...auditData,
    },
  });

  // Criar posições do ciclo (4x2 = 4 dias trabalho, 2 dias folga)
  for (let i = 0; i < 6; i++) {
    await prisma.tipoEscalaCicloPosicao.create({
      data: {
        tipoEscalaId: tipoEscala1.id,
        posicao: i,
        status: i < 4 ? 'TRABALHO' : 'FOLGA',
        ...auditData,
      },
    });
  }

  // Criar período de escala para as equipes
  const periodoInicio = addDays(getToday(), -30);
  const periodoFim = addDays(getToday(), 60);

  const escalaEquipe1 = await prisma.escalaEquipePeriodo.create({
    data: {
      equipeId: equipe1.id,
      periodoInicio,
      periodoFim,
      tipoEscalaId: tipoEscala1.id,
      status: 'PUBLICADA',
      versao: 1,
      ...auditData,
    },
  });

  const escalaEquipe2 = await prisma.escalaEquipePeriodo.create({
    data: {
      equipeId: equipe2.id,
      periodoInicio,
      periodoFim,
      tipoEscalaId: tipoEscala1.id,
      status: 'PUBLICADA',
      versao: 1,
      ...auditData,
    },
  });

  // Criar slots de escala (últimos 30 dias e próximos 30 dias)
  console.log('📆 Criando slots de escala...');
  for (let i = -30; i <= 30; i++) {
    const data = addDays(getToday(), i);
    const diaSemana = data.getDay();
    const posicaoCiclo = ((i + 30) % 6 + 6) % 6;

    // Equipe 1 - 4 eletricistas
    for (let j = 0; j < 4; j++) {
      const eletricista = eletricistas[j];
      const status = posicaoCiclo < 4 ? 'TRABALHO' : 'FOLGA';
      await prisma.slotEscala.create({
        data: {
          escalaEquipePeriodoId: escalaEquipe1.id,
          eletricistaId: eletricista.id,
          data,
          estado: status as any,
          inicioPrevisto: status === 'TRABALHO' ? '06:00:00' : null,
          fimPrevisto: status === 'TRABALHO' ? '14:00:00' : null,
          origem: 'GERACAO',
          ...auditData,
        },
      });
    }

    // Equipe 2 - 4 eletricistas
    for (let j = 4; j < 8; j++) {
      const eletricista = eletricistas[j];
      const status = posicaoCiclo < 4 ? 'TRABALHO' : 'FOLGA';
      await prisma.slotEscala.create({
        data: {
          escalaEquipePeriodoId: escalaEquipe2.id,
          eletricistaId: eletricista.id,
          data,
          estado: status as any,
          inicioPrevisto: status === 'TRABALHO' ? '06:00:00' : null,
          fimPrevisto: status === 'TRABALHO' ? '14:00:00' : null,
          origem: 'GERACAO',
          ...auditData,
        },
      });
    }
  }

  // Criar horários de vigência das equipes
  await prisma.equipeHorarioVigencia.create({
    data: {
      equipeId: equipe1.id,
      inicioTurnoHora: '06:00:00',
      duracaoHoras: 8.0,
      vigenciaInicio: periodoInicio,
      ...auditData,
    },
  });

  await prisma.equipeHorarioVigencia.create({
    data: {
      equipeId: equipe2.id,
      inicioTurnoHora: '06:00:00',
      duracaoHoras: 8.0,
      vigenciaInicio: periodoInicio,
      ...auditData,
    },
  });

  // ============================================
  // 12. TURNOS ABERTOS
  // ============================================
  console.log('🔄 Criando turnos abertos...');
  const hoje = getToday();
  const turno1 = await prisma.turno.create({
    data: {
      dataSolicitacao: getDateAtTime(hoje, 5, 30),
      dataInicio: getDateAtTime(hoje, 6, 0),
      veiculoId: veiculos[0].id,
      equipeId: equipe1.id,
      dispositivo: 'MOBILE-001',
      kmInicio: 15000,
      ...auditData,
    },
  });

  const turno2 = await prisma.turno.create({
    data: {
      dataSolicitacao: getDateAtTime(hoje, 5, 45),
      dataInicio: getDateAtTime(hoje, 6, 0),
      veiculoId: veiculos[1].id,
      equipeId: equipe2.id,
      dispositivo: 'MOBILE-002',
      kmInicio: 25000,
      ...auditData,
    },
  });

  // Associar eletricistas aos turnos
  await prisma.turnoEletricista.create({
    data: {
      turnoId: turno1.id,
      eletricistaId: eletricistas[0].id,
      ...auditData,
    },
  });

  await prisma.turnoEletricista.create({
    data: {
      turnoId: turno1.id,
      eletricistaId: eletricistas[1].id,
      ...auditData,
    },
  });

  await prisma.turnoEletricista.create({
    data: {
      turnoId: turno2.id,
      eletricistaId: eletricistas[4].id,
      ...auditData,
    },
  });

  await prisma.turnoEletricista.create({
    data: {
      turnoId: turno2.id,
      eletricistaId: eletricistas[5].id,
      ...auditData,
    },
  });

  // ============================================
  // 13. CHECKLISTS PREENCHIDOS
  // ============================================
  console.log('✅ Criando checklists preenchidos...');
  const checklistPreenchido1 = await prisma.checklistPreenchido.create({
    data: {
      uuid: generateUUID(),
      turnoId: turno1.id,
      checklistId: checklist1.id,
      eletricistaId: eletricistas[0].id,
      dataPreenchimento: getDateAtTime(hoje, 6, 15),
      latitude: -23.5505,
      longitude: -46.6333,
      ...auditData,
    },
  });

  const checklistPreenchido2 = await prisma.checklistPreenchido.create({
    data: {
      uuid: generateUUID(),
      turnoId: turno2.id,
      checklistId: checklist2.id,
      eletricistaId: eletricistas[4].id,
      dataPreenchimento: getDateAtTime(hoje, 6, 20),
      latitude: -23.5505,
      longitude: -46.6333,
      ...auditData,
    },
  });

  // Criar respostas dos checklists
  const resposta1 = await prisma.checklistResposta.create({
    data: {
      checklistPreenchidoId: checklistPreenchido1.id,
      perguntaId: pergunta1.id,
      opcaoRespostaId: opcaoSim.id,
      dataResposta: getDateAtTime(hoje, 6, 16),
      aguardandoFoto: false,
      fotosSincronizadas: 0,
      ...auditData,
    },
  });

  const resposta2 = await prisma.checklistResposta.create({
    data: {
      checklistPreenchidoId: checklistPreenchido1.id,
      perguntaId: pergunta2.id,
      opcaoRespostaId: opcaoNao.id,
      dataResposta: getDateAtTime(hoje, 6, 17),
      aguardandoFoto: true,
      fotosSincronizadas: 0,
      ...auditData,
    },
  });

  // Criar pendência para resposta que gera pendência
  await prisma.checklistPendencia.create({
    data: {
      checklistRespostaId: resposta2.id,
      checklistPreenchidoId: checklistPreenchido1.id,
      turnoId: turno1.id,
      status: 'AGUARDANDO_TRATAMENTO',
      observacaoProblema: 'Pneu com desgaste irregular detectado',
      ...auditData,
    },
  });

  // ============================================
  // 14. TURNOS REALIZADOS (Histórico)
  // ============================================
  console.log('📊 Criando turnos realizados...');
  const ontem = addDays(getToday(), -1);
  const turnoRealizado1 = await prisma.turnoRealizado.create({
    data: {
      dataReferencia: ontem,
      equipeId: equipe1.id,
      origem: 'mobile',
      abertoEm: getDateAtTime(ontem, 6, 0),
      abertoPor: eletricistas[0].matricula,
      fechadoEm: getDateAtTime(ontem, 14, 30),
      fechadoPor: eletricistas[0].matricula,
      createdAt: getDateAtTime(ontem, 6, 0),
      createdBy: 'seed-script',
    },
  });

  const turnoRealizado2 = await prisma.turnoRealizado.create({
    data: {
      dataReferencia: ontem,
      equipeId: equipe2.id,
      origem: 'mobile',
      abertoEm: getDateAtTime(ontem, 6, 0),
      abertoPor: eletricistas[4].matricula,
      fechadoEm: getDateAtTime(ontem, 14, 30),
      fechadoPor: eletricistas[4].matricula,
      createdAt: getDateAtTime(ontem, 6, 0),
      createdBy: 'seed-script',
    },
  });

  // Criar itens de turnos realizados (eletricistas)
  await prisma.turnoRealizadoEletricista.create({
    data: {
      turnoRealizadoId: turnoRealizado1.id,
      eletricistaId: eletricistas[0].id,
      status: 'fechado',
      abertoEm: getDateAtTime(ontem, 6, 0),
      fechadoEm: getDateAtTime(ontem, 14, 30),
      deviceInfo: 'Android 13 - Samsung Galaxy',
      createdAt: getDateAtTime(ontem, 6, 0),
      createdBy: 'seed-script',
    },
  });

  await prisma.turnoRealizadoEletricista.create({
    data: {
      turnoRealizadoId: turnoRealizado1.id,
      eletricistaId: eletricistas[1].id,
      status: 'fechado',
      abertoEm: getDateAtTime(ontem, 6, 0),
      fechadoEm: getDateAtTime(ontem, 14, 30),
      deviceInfo: 'Android 12 - Motorola',
      createdAt: getDateAtTime(ontem, 6, 0),
      createdBy: 'seed-script',
    },
  });

  await prisma.turnoRealizadoEletricista.create({
    data: {
      turnoRealizadoId: turnoRealizado2.id,
      eletricistaId: eletricistas[4].id,
      status: 'fechado',
      abertoEm: getDateAtTime(ontem, 6, 0),
      fechadoEm: getDateAtTime(ontem, 14, 30),
      deviceInfo: 'iOS 17 - iPhone 13',
      createdAt: getDateAtTime(ontem, 6, 0),
      createdBy: 'seed-script',
    },
  });

  // Criar mais turnos realizados para histórico (últimos 7 dias)
  for (let i = 2; i <= 7; i++) {
    const dataRef = addDays(getToday(), -i);
    const equipe = i % 2 === 0 ? equipe1 : equipe2;
    const eletricistaBase = i % 2 === 0 ? 0 : 4;

    const turnoRealizado = await prisma.turnoRealizado.create({
      data: {
        dataReferencia: dataRef,
        equipeId: equipe.id,
        origem: 'mobile',
        abertoEm: getDateAtTime(dataRef, 6, 0),
        abertoPor: eletricistas[eletricistaBase].matricula,
        fechadoEm: getDateAtTime(dataRef, 14, 30),
        fechadoPor: eletricistas[eletricistaBase].matricula,
        createdAt: getDateAtTime(dataRef, 6, 0),
        createdBy: 'seed-script',
      },
    });

    await prisma.turnoRealizadoEletricista.create({
      data: {
        turnoRealizadoId: turnoRealizado.id,
        eletricistaId: eletricistas[eletricistaBase].id,
        status: 'fechado',
        abertoEm: getDateAtTime(dataRef, 6, 0),
        fechadoEm: getDateAtTime(dataRef, 14, 30),
        deviceInfo: 'Android 13',
        createdAt: getDateAtTime(dataRef, 6, 0),
        createdBy: 'seed-script',
      },
    });
  }

  // ============================================
  // 15. FALTAS E JUSTIFICATIVAS
  // ============================================
  console.log('❌ Criando faltas e justificativas...');
  const tipoJustificativa1 = await prisma.tipoJustificativa.create({
    data: {
      nome: 'Atestado Médico',
      descricao: 'Falta justificada por atestado médico',
      ativo: true,
      geraFalta: true, // Atestado médico gera falta
      createdAt: getToday(),
      createdBy: 'seed-script',
    },
  });

  const tipoJustificativa2 = await prisma.tipoJustificativa.create({
    data: {
      nome: 'Falta Justificada',
      descricao: 'Falta com justificativa aprovada',
      ativo: true,
      geraFalta: true, // Falta justificada ainda gera falta
      createdAt: getToday(),
      createdBy: 'seed-script',
    },
  });

  const tipoJustificativa3 = await prisma.tipoJustificativa.create({
    data: {
      nome: 'Trabalho no Pátio',
      descricao: 'Equipe trabalhou no pátio devido a problemas operacionais',
      ativo: true,
      geraFalta: false, // Trabalho no pátio NÃO gera falta, conta como dia trabalhado
      createdAt: getToday(),
      createdBy: 'seed-script',
    },
  });

  const tipoJustificativa4 = await prisma.tipoJustificativa.create({
    data: {
      nome: 'Problema no Veículo',
      descricao: 'Veículo quebrado sem veículo reserva disponível',
      ativo: true,
      geraFalta: false, // Problema no veículo NÃO gera falta, conta como dia trabalhado
      createdAt: getToday(),
      createdBy: 'seed-script',
    },
  });

  const tipoJustificativa5 = await prisma.tipoJustificativa.create({
    data: {
      nome: 'Falta de Reposição',
      descricao: 'Falta de eletricista sem reposição disponível',
      ativo: true,
      geraFalta: true, // Falta de reposição gera falta
      createdAt: getToday(),
      createdBy: 'seed-script',
    },
  });

  // Criar falta (há 3 dias)
  const dataFalta = addDays(getToday(), -3);
  const falta1 = await prisma.falta.create({
    data: {
      dataReferencia: dataFalta,
      equipeId: equipe1.id,
      eletricistaId: eletricistas[2].id,
      motivoSistema: 'falta_abertura',
      status: 'justificada',
      createdAt: dataFalta,
      createdBy: 'system',
    },
  });

  // Criar justificativa para a falta
  const justificativa1 = await prisma.justificativa.create({
    data: {
      tipoId: tipoJustificativa1.id,
      descricao: 'Atestado médico válido por 1 dia',
      status: 'aprovada',
      createdAt: addDays(dataFalta, 1),
      createdBy: eletricistas[2].matricula,
      decidedBy: supervisor1.nome,
      decidedAt: addDays(dataFalta, 1),
    },
  });

  await prisma.faltaJustificativa.create({
    data: {
      faltaId: falta1.id,
      justificativaId: justificativa1.id,
      linkedAt: addDays(dataFalta, 1),
    },
  });

  // Criar evento de cobertura (quando alguém cobre a falta)
  const slotFalta = await prisma.slotEscala.findFirst({
    where: {
      escalaEquipePeriodoId: escalaEquipe1.id,
      eletricistaId: eletricistas[2].id,
      data: dataFalta,
    },
  });

  if (slotFalta) {
    await prisma.eventoCobertura.create({
      data: {
        slotEscalaId: slotFalta.id,
        eletricistaCobrindoId: eletricistas[3].id,
        tipo: 'FALTA',
        resultado: 'COBERTO',
        justificativa: 'Eletricista substituto designado',
        registradoEm: dataFalta,
        ...auditData,
      },
    });
  }

  // ============================================
  // 16. HORAS EXTRAS
  // ============================================
  console.log('⏰ Criando horas extras...');
  const turnoRealizadoEletricista = await prisma.turnoRealizadoEletricista.findFirst({
    where: {
      turnoRealizadoId: turnoRealizado1.id,
    },
  });

  if (turnoRealizadoEletricista) {
    await prisma.horaExtra.create({
      data: {
        dataReferencia: ontem,
        eletricistaId: eletricistas[0].id,
        turnoRealizadoEletricistaId: turnoRealizadoEletricista.id,
        tipo: 'extrafora',
        horasPrevistas: 8.0,
        horasRealizadas: 10.0,
        diferencaHoras: 2.0,
        observacoes: 'Trabalho extra para conclusão de serviço urgente',
        status: 'aprovada',
        ...auditData,
      },
    });
  }

  // ============================================
  // 17. DIVERGÊNCIAS DE ESCALA
  // ============================================
  console.log('⚠️ Criando divergências de escala...');
  const dataDivergencia = addDays(getToday(), -5);
  await prisma.divergenciaEscala.create({
    data: {
      dataReferencia: dataDivergencia,
      equipePrevistaId: equipe1.id,
      equipeRealId: equipe2.id,
      eletricistaId: eletricistas[1].id,
      tipo: 'equipe_divergente',
      detalhe: 'Eletricista trabalhou em equipe diferente da prevista na escala',
      createdAt: dataDivergencia,
      createdBy: 'system',
    },
  });

  // ============================================
  // 18. CATÁLOGO DE HORÁRIOS DE ABERTURA
  // ============================================
  console.log('🕐 Criando catálogo de horários...');
  const horarioCatalogo1 = await prisma.horarioAberturaCatalogo.create({
    data: {
      nome: '06h • 8h + 1h int.',
      inicioTurnoHora: '06:00:00',
      duracaoHoras: 8.0,
      duracaoIntervaloHoras: 1.0,
      ativo: true,
      ...auditData,
    },
  });

  const horarioCatalogo2 = await prisma.horarioAberturaCatalogo.create({
    data: {
      nome: '07h • 8h + 1h int.',
      inicioTurnoHora: '07:00:00',
      duracaoHoras: 8.0,
      duracaoIntervaloHoras: 1.0,
      ativo: true,
      ...auditData,
    },
  });

  // Criar histórico de horários de turno
  await prisma.equipeTurnoHistorico.create({
    data: {
      equipeId: equipe1.id,
      horarioAberturaCatalogoId: horarioCatalogo1.id,
      dataInicio: periodoInicio,
      inicioTurnoHora: '06:00:00',
      duracaoHoras: 8.0,
      duracaoIntervaloHoras: 1.0,
      fimTurnoHora: '15:00:00',
      motivo: 'Configuração inicial da equipe',
      ...auditData,
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📊 Resumo dos dados criados:');
  console.log(`- ${await prisma.contrato.count()} contratos`);
  console.log(`- ${await prisma.base.count()} bases`);
  console.log(`- ${await prisma.cargo.count()} cargos`);
  console.log(`- ${await prisma.tipoVeiculo.count()} tipos de veículo`);
  console.log(`- ${await prisma.veiculo.count()} veículos`);
  console.log(`- ${await prisma.tipoEquipe.count()} tipos de equipe`);
  console.log(`- ${await prisma.equipe.count()} equipes`);
  console.log(`- ${await prisma.supervisor.count()} supervisores`);
  console.log(`- ${await prisma.eletricista.count()} eletricistas`);
  console.log(`- ${await prisma.turno.count()} turnos abertos`);
  console.log(`- ${await prisma.turnoRealizado.count()} turnos realizados`);
  console.log(`- ${await prisma.escalaEquipePeriodo.count()} períodos de escala`);
  console.log(`- ${await prisma.slotEscala.count()} slots de escala`);
  console.log(`- ${await prisma.checklistPreenchido.count()} checklists preenchidos`);
  console.log(`- ${await prisma.falta.count()} faltas`);
  console.log(`- ${await prisma.justificativa.count()} justificativas`);
  console.log(`- ${await prisma.horaExtra.count()} horas extras`);
  console.log(`- ${await prisma.divergenciaEscala.count()} divergências`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

