/**
 * Server Action para buscar escalas publicadas com dados processados
 *
 * Similar a getEscalasPublicadas, mas retorna dados já processados:
 * - Agrupamento de slots por eletricista
 * - Estrutura de tabela pronta
 * - Filtros aplicados
 * - Valores únicos para dropdowns
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const escalasProcessadasSchema = z.object({
  periodoInicio: z.coerce.date(),
  periodoFim: z.coerce.date(),
  filtroBase: z.string().optional(),
  filtroTipoEquipe: z.string().optional(),
  filtroEquipe: z.string().optional(),
  filtroEletricista: z.string().optional(),
  filtroHorario: z.string().optional(),
});

export const getEscalasPublicadasProcessadas = async (rawData: unknown) =>
  handleServerAction(
    escalasProcessadasSchema,
    async data => {
      // Buscar escalas publicadas (mesmo padrão da action original)
      const escalas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLICADA',
          OR: [
            {
              AND: [
                { periodoInicio: { lte: data.periodoFim } },
                { periodoFim: { gte: data.periodoInicio } },
              ],
            },
          ],
        },
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
              tipoEquipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          tipoEscala: {
            select: {
              nome: true,
              modoRepeticao: true,
            },
          },
          Slots: {
            where: {
              deletedAt: null,
              data: {
                gte: data.periodoInicio,
                lte: data.periodoFim,
              },
            },
            select: {
              id: true,
              data: true,
              estado: true,
              eletricistaId: true,
              inicioPrevisto: true,
              fimPrevisto: true,
              anotacoesDia: true,
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
            orderBy: {
              data: 'asc',
            },
          },
        },
        orderBy: [{ periodoInicio: 'asc' }, { equipeId: 'asc' }],
      });

      // Buscar bases separadamente (mesmo padrão)
      const equipeIds = escalas.map(e => e.equipeId);

      const todasBases = await prisma.equipeBaseHistorico.findMany({
        where: {
          equipeId: { in: equipeIds },
          dataFim: null,
          deletedAt: null,
        },
        include: {
          base: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          dataInicio: 'desc',
        },
      });

      const todosHorarios = await prisma.equipeTurnoHistorico.findMany({
        where: {
          equipeId: { in: equipeIds },
          deletedAt: null,
          dataInicio: { lte: data.periodoFim },
          OR: [{ dataFim: null }, { dataFim: { gte: data.periodoInicio } }],
        },
        select: {
          id: true,
          equipeId: true,
          inicioTurnoHora: true,
          duracaoHoras: true,
          duracaoIntervaloHoras: true,
          fimTurnoHora: true,
          dataInicio: true,
          dataFim: true,
        },
      });

      // Mapear base e horário por equipe
      const basePorEquipe = new Map<number, (typeof todasBases)[0]>();
      todasBases.forEach(base => {
        if (!basePorEquipe.has(base.equipeId)) {
          basePorEquipe.set(base.equipeId, base);
        }
      });

      const horarioPorEquipe = new Map<number, (typeof todosHorarios)[0]>();
      todosHorarios.forEach(horario => {
        if (!horarioPorEquipe.has(horario.equipeId)) {
          horarioPorEquipe.set(horario.equipeId, horario);
        }
      });

      // Processar dados no servidor
      const tableData: any[] = [];
      const basesSet = new Set<string>();
      const tiposEquipeSet = new Set<string>();
      const equipesSet = new Set<string>();
      const horariosSet = new Set<string>();

      // Gerar dias
      const dias: Date[] = [];
      const currentDate = new Date(data.periodoInicio);
      while (currentDate <= data.periodoFim) {
        dias.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      escalas.forEach(escala => {
        const baseHistorico = basePorEquipe.get(escala.equipeId);
        const horario = horarioPorEquipe.get(escala.equipeId);
        const baseNome = baseHistorico?.base?.nome || '-';
        const tipoEquipeNome = escala.equipe?.tipoEquipe?.nome || '-';
        const equipeNome = escala.equipe?.nome || '-';

        // Aplicar filtros de equipe, base, tipo
        if (data.filtroBase && baseNome !== data.filtroBase) return;
        if (data.filtroTipoEquipe && tipoEquipeNome !== data.filtroTipoEquipe)
          return;
        if (data.filtroEquipe && equipeNome !== data.filtroEquipe) return;

        const horarioStr = horario
          ? `${horario.inicioTurnoHora.substring(0, 5)}${
              horario.fimTurnoHora
                ? ` - ${horario.fimTurnoHora.substring(0, 5)}`
                : ''
            }`
          : 'Sem horário definido';

        if (data.filtroHorario && horarioStr !== data.filtroHorario) return;

        // Coletar valores únicos
        basesSet.add(baseNome);
        tiposEquipeSet.add(tipoEquipeNome);
        equipesSet.add(equipeNome);
        horariosSet.add(horarioStr);

        // Agrupar slots por eletricista
        const slotsPorEletricista = new Map<number, typeof escala.Slots>();
        escala.Slots.forEach(slot => {
          if (!slotsPorEletricista.has(slot.eletricistaId)) {
            slotsPorEletricista.set(slot.eletricistaId, []);
          }
          slotsPorEletricista.get(slot.eletricistaId)!.push(slot);
        });

        const eletricistasIds = Array.from(slotsPorEletricista.keys());
        const totalEletricistas = eletricistasIds.length;

        eletricistasIds.forEach((eletricistaId, index) => {
          const slots = slotsPorEletricista.get(eletricistaId)!;
          const primeiroSlot = slots[0];
          const eletricista = primeiroSlot.eletricista;

          // Filtro de eletricista
          if (data.filtroEletricista) {
            const busca = data.filtroEletricista.toLowerCase();
            const nomeMatch = eletricista.nome.toLowerCase().includes(busca);
            const matriculaMatch = eletricista.matricula
              .toLowerCase()
              .includes(busca);
            if (!nomeMatch && !matriculaMatch) return;
          }

          const row: any = {
            key: `${escala.id}-${eletricistaId}`,
            escalaId: escala.id,
            equipeId: escala.equipe.id,
            eletricistaId,
            equipeNome,
            tipoEquipe: tipoEquipeNome,
            base: baseNome,
            prefixo: equipeNome.substring(0, 10),
            horario: horarioStr,
            temHorario: !!horario,
            eletricista: eletricista.nome,
            matricula: eletricista.matricula,
            isFirstRow: index === 0,
            rowSpan: index === 0 ? totalEletricistas : 0,
          };

          // Adicionar slots por dia
          dias.forEach(dia => {
            const diaKey = dia.toISOString().split('T')[0];
            const slot = slots.find(s => {
              const slotDate = new Date(s.data);
              return slotDate.toISOString().split('T')[0] === diaKey;
            });
            row[diaKey] = slot ? slot.estado : null;
            if (slot) {
              row[`${diaKey}_slot`] = slot;
            }
          });

          tableData.push(row);
        });
      });

      return {
        tableData,
        valoresUnicos: {
          bases: Array.from(basesSet).sort(),
          tiposEquipe: Array.from(tiposEquipeSet).sort(),
          equipes: Array.from(equipesSet).sort(),
          horarios: Array.from(horariosSet).sort(),
        },
      };
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );
