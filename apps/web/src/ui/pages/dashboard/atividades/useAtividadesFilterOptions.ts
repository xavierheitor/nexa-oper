'use client';

import { listEletricistas } from '@/lib/actions/eletricista/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import { listTurnos } from '@/lib/actions/turno/list';
import { listVeiculos } from '@/lib/actions/veiculo/list';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import type {
  EletricistaFiltroOption,
  EquipeFiltroOption,
  TipoAtividadeFiltroOption,
  TipoAtividadeServicoFiltroOption,
  TurnoFiltroOption,
  VeiculoFiltroOption,
} from '@/lib/types/atividadeDashboard';

export function useAtividadesFilterOptions() {
  const tiposAtividade = useEntityData<TipoAtividadeFiltroOption>({
    key: 'atividade-filtro-tipos-atividade',
    fetcherAction: unwrapFetcher(listTiposAtividade),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const tiposAtividadeServico = useEntityData<TipoAtividadeServicoFiltroOption>({
    key: 'atividade-filtro-subtipos-atividade',
    fetcherAction: unwrapFetcher(listTiposAtividadeServico),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      include: {
        atividadeTipo: true,
      },
    },
  });

  const turnos = useEntityData<TurnoFiltroOption>({
    key: 'atividade-filtro-turnos',
    fetcherAction: unwrapFetcher(listTurnos),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 500,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        equipe: true,
        veiculo: true,
      },
    },
  });

  const equipes = useEntityData<EquipeFiltroOption>({
    key: 'atividade-filtro-equipes',
    fetcherAction: unwrapFetcher(listEquipes),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const veiculos = useEntityData<VeiculoFiltroOption>({
    key: 'atividade-filtro-veiculos',
    fetcherAction: unwrapFetcher(listVeiculos),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'placa',
      orderDir: 'asc',
    },
  });

  const eletricistas = useEntityData<EletricistaFiltroOption>({
    key: 'atividade-filtro-eletricistas',
    fetcherAction: unwrapFetcher(listEletricistas),
    paginationEnabled: false,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  return {
    tiposAtividade,
    tiposAtividadeServico,
    turnos,
    equipes,
    veiculos,
    eletricistas,
  };
}
