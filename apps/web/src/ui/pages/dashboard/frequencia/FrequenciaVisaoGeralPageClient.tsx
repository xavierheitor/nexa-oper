'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Space,
  DatePicker,
  Select,
  Button,
  Spin,
  Row,
  Col,
  Statistic,
  Tag,
  Empty,
  Table,
} from 'antd';
import { App } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { getConsolidadoEletricista } from '@/lib/actions/turno-realizado/getConsolidadoEletricista';
import { listTurnos } from '@/lib/actions/turno/list';
import { getSlotsEscalaEquipePeriodo } from '@/lib/actions/escala/getSlotsEscalaEquipePeriodo';
import { ConsolidadoEletricistaResponse } from '@/lib/schemas/turnoRealizadoSchema';
import ConsolidadoEletricistaCard from '@/ui/components/ConsolidadoEletricistaCard';
import HistoricoTable from '@/ui/components/HistoricoTable';
import CalendarioFrequencia from '@/ui/components/CalendarioFrequencia';
import ChecklistSelectorModal, {
  type ChecklistPreenchido,
} from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import { errorHandler } from '@/lib/utils/errorHandler';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

interface TurnoEquipeRow {
  id: number;
  dataInicio: Date | string;
  dataFim?: Date | string | null;
  veiculoPlaca?: string;
  veiculoModelo?: string;
  equipeNome?: string;
  tipoEquipeNome?: string;
  baseNome?: string;
  eletricistas?: Array<{
    id: number;
    nome: string;
    matricula: string;
    motorista?: boolean;
  }>;
}

interface SlotEscalaEquipe {
  id: number;
  data: Date | string;
  inicioPrevisto?: string | null;
  fimPrevisto?: string | null;
  eletricistaId: number;
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
}

interface TurnoEquipeHistoricoRow {
  key: string;
  data: Date;
  dataInicio?: Date | string;
  dataFim?: Date | string | null;
  veiculoPlaca?: string;
  veiculoModelo?: string;
  equipeNome?: string;
  eletricistasAbertura: Array<{
    id: number;
    nome: string;
    matricula: string;
    motorista?: boolean;
  }>;
  eletricistasEscala: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>;
  status: 'ABERTO' | 'FECHADO' | 'PREVISTO';
  turnoId?: number;
}

interface NamedOption {
  id: number;
  nome: string;
}

interface EletricistaOption extends NamedOption {
  matricula?: string;
}

interface VeiculoOption {
  id: number;
  placa: string;
  modelo?: string;
}

interface FrequenciaVisaoGeralPageClientProps {
  initialEletricistas: EletricistaOption[];
  initialEquipes: NamedOption[];
  initialVeiculos: VeiculoOption[];
}

/**
 * Página de Visão Geral de Frequência
 *
 * Permite visualizar um resumo completo da frequência de um eletricista
 * com filtros de período, mostrando dias trabalhados, faltas, atestados,
 * horas extras, etc.
 */
export default function FrequenciaVisaoGeralPageClient({
  initialEletricistas,
  initialEquipes,
  initialVeiculos,
}: FrequenciaVisaoGeralPageClientProps) {
  const { message: messageApi } = App.useApp();

  // Estados para filtros
  const [eletricistaId, setEletricistaId] = useState<number | undefined>(
    undefined
  );
  const [dataInicio, setDataInicio] = useState<Date | undefined>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1); // Início do mês
  });
  const [dataFim, setDataFim] = useState<Date | undefined>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59); // Fim do mês
  });
  // ✅ Filtro de status (client-side)
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(
    undefined
  );

  // Estados para visão geral de equipes
  const [equipeId, setEquipeId] = useState<number | undefined>(undefined);
  const [veiculoId, setVeiculoId] = useState<number | undefined>(undefined);
  const [dataInicioEquipe, setDataInicioEquipe] = useState<Date | undefined>(
    () => {
      const hoje = new Date();
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    }
  );
  const [dataFimEquipe, setDataFimEquipe] = useState<Date | undefined>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  });
  const [checklistSelectorVisible, setChecklistSelectorVisible] =
    useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurnoEquipe, setSelectedTurnoEquipe] =
    useState<TurnoEquipeRow | null>(null);
  const [selectedChecklist, setSelectedChecklist] =
    useState<ChecklistPreenchido | null>(null);

  const eletricistas = initialEletricistas;
  const equipes = initialEquipes;
  const veiculos = initialVeiculos;
  const loadingEletricistas = false;
  const loadingEquipes = false;
  const loadingVeiculos = false;

  // Fetcher para dados consolidados
  const consolidadoFetcher =
    async (): Promise<ConsolidadoEletricistaResponse> => {
      if (!eletricistaId) {
        throw new Error('Selecione um eletricista');
      }

      if (!dataInicio || !dataFim) {
        throw new Error('Selecione o período');
      }

      const result = await getConsolidadoEletricista({
        eletricistaId,
        periodo: 'custom',
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados consolidados');
      }

      if (!result.data) {
        throw new Error('Dados não retornados');
      }

      return result.data;
    };

  const {
    data: consolidado,
    error,
    isLoading: loadingConsolidado,
    mutate,
  } = useSWR<ConsolidadoEletricistaResponse>(
    eletricistaId && dataInicio && dataFim
      ? ['frequencia-visao-geral', eletricistaId, dataInicio, dataFim]
      : null,
    consolidadoFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const turnosEquipeFetcher = async (): Promise<TurnoEquipeRow[]> => {
    if (!equipeId && !veiculoId) {
      throw new Error('Selecione uma equipe ou veículo');
    }

    if (!dataInicioEquipe || !dataFimEquipe) {
      throw new Error('Selecione o período');
    }

    const result = await listTurnos({
      page: 1,
      pageSize: 2000,
      orderBy: 'dataInicio',
      orderDir: 'desc',
      equipeId,
      veiculoId,
      dataInicio: dataInicioEquipe,
      dataFim: dataFimEquipe,
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar turnos da equipe');
    }

    return result.data?.data || [];
  };

  const slotsEquipeFetcher = async (): Promise<SlotEscalaEquipe[]> => {
    if (!equipeId) {
      throw new Error('Selecione uma equipe');
    }

    if (!dataInicioEquipe || !dataFimEquipe) {
      throw new Error('Selecione o período');
    }

    const result = await getSlotsEscalaEquipePeriodo({
      equipeId,
      dataInicio: dataInicioEquipe,
      dataFim: dataFimEquipe,
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar escala da equipe');
    }

    return result.data || [];
  };

  const {
    data: turnosEquipe,
    error: errorEquipe,
    isLoading: loadingEquipe,
    mutate: mutateEquipe,
  } = useSWR<TurnoEquipeRow[]>(
    (equipeId || veiculoId) && dataInicioEquipe && dataFimEquipe
      ? [
          'frequencia-visao-geral-equipe',
          equipeId,
          veiculoId,
          dataInicioEquipe.toISOString(),
          dataFimEquipe.toISOString(),
        ]
      : null,
    turnosEquipeFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const {
    data: slotsEquipe,
    error: errorEscalaEquipe,
    isLoading: loadingEscalaEquipe,
    mutate: mutateEscalaEquipe,
  } = useSWR<SlotEscalaEquipe[]>(
    equipeId && dataInicioEquipe && dataFimEquipe
      ? [
          'frequencia-visao-geral-equipe-escala',
          equipeId,
          dataInicioEquipe.toISOString(),
          dataFimEquipe.toISOString(),
        ]
      : null,
    slotsEquipeFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (error) {
      errorHandler.log(error, 'FrequenciaVisaoGeralPage');
      messageApi.error(error.message || 'Erro ao carregar dados de frequência');
    }
  }, [error, messageApi]);

  useEffect(() => {
    if (errorEquipe) {
      errorHandler.log(errorEquipe, 'FrequenciaVisaoGeralEquipe');
      messageApi.error(
        errorEquipe.message || 'Erro ao carregar turnos da equipe'
      );
    }
  }, [errorEquipe, messageApi]);

  useEffect(() => {
    if (errorEscalaEquipe) {
      errorHandler.log(errorEscalaEquipe, 'FrequenciaVisaoGeralEquipeEscala');
      messageApi.error(
        errorEscalaEquipe.message || 'Erro ao carregar escala da equipe'
      );
    }
  }, [errorEscalaEquipe, messageApi]);

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDataInicio(dates[0].toDate());
      setDataFim(dates[1].toDate());
    } else {
      setDataInicio(undefined);
      setDataFim(undefined);
    }
  };

  const handleBuscar = () => {
    if (!eletricistaId) {
      messageApi.warning('Selecione um eletricista');
      return;
    }
    if (!dataInicio || !dataFim) {
      messageApi.warning('Selecione o período');
      return;
    }
    mutate();
  };

  const handleRangeChangeEquipe = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDataInicioEquipe(dates[0].startOf('day').toDate());
      setDataFimEquipe(dates[1].endOf('day').toDate());
    } else {
      setDataInicioEquipe(undefined);
      setDataFimEquipe(undefined);
    }
  };

  const handleBuscarEquipe = () => {
    if (!equipeId && !veiculoId) {
      messageApi.warning('Selecione uma equipe ou um veículo');
      return;
    }
    if (!dataInicioEquipe || !dataFimEquipe) {
      messageApi.warning('Selecione o período');
      return;
    }
    mutateEquipe();
    if (equipeId) {
      mutateEscalaEquipe();
    }
  };

  const handleSelectChecklist = (checklist: ChecklistPreenchido) => {
    setSelectedChecklist(checklist);
    setChecklistViewerVisible(true);
  };

  const handleCloseChecklistSelector = () => {
    setChecklistSelectorVisible(false);
    setSelectedTurnoEquipe(null);
  };

  const handleCloseChecklistViewer = () => {
    setChecklistViewerVisible(false);
    setSelectedChecklist(null);
  };

  // ✅ Filtrar detalhamento por status (client-side)
  const detalhamentoFiltrado = useMemo(() => {
    if (!consolidado) return [];

    let filtrado = consolidado.detalhamento;

    if (filtroStatus) {
      filtrado = filtrado.filter(dia => {
        // Mapear tipos para filtros
        switch (filtroStatus) {
          case 'trabalho':
            return (
              dia.tipo === 'trabalho' ||
              dia.tipo === 'trabalho_realizado' ||
              dia.tipo === 'escala_trabalho'
            );
          case 'falta':
            return dia.tipo === 'falta';
          case 'hora_extra':
            return dia.tipo === 'hora_extra';
          case 'folga':
            return dia.tipo === 'folga' || dia.tipo === 'escala_folga';
          case 'atestado':
            return dia.tipo === 'falta' && dia.status === 'justificada';
          default:
            return true;
        }
      });
    }

    return filtrado;
  }, [consolidado, filtroStatus]);

  const estatisticasDetalhadas = useMemo(() => {
    if (!consolidado) return null;

    const detalhamento = detalhamentoFiltrado;

    // Calcular dias por tipo
    const diasPorTipo = detalhamento.reduce(
      (acc, dia) => {
        if (dia.tipo === 'trabalho') acc.trabalhados++;
        if (dia.tipo === 'falta') acc.faltas++;
        if (dia.tipo === 'hora_extra') acc.horasExtras++;
        if (dia.tipo === 'folga') acc.folgas++;
        return acc;
      },
      { trabalhados: 0, faltas: 0, horasExtras: 0, folgas: 0 }
    );

    // Contar atestados (faltas justificadas)
    const atestados = detalhamento.filter(
      dia => dia.tipo === 'falta' && dia.status === 'justificada'
    ).length;

    // Calcular total de horas
    const totalHorasPrevistas = detalhamento.reduce(
      (acc, dia) => acc + (dia.horasPrevistas || 0),
      0
    );
    const totalHorasRealizadas = detalhamento.reduce(
      (acc, dia) => acc + (dia.horasRealizadas || 0),
      0
    );

    return {
      ...diasPorTipo,
      atestados,
      totalHorasPrevistas,
      totalHorasRealizadas,
    };
  }, [consolidado, detalhamentoFiltrado]);

  const slotsPorDia = useMemo(() => {
    const map = new Map<
      string,
      {
        data: Date;
        eletricistas: Map<
          number,
          { id: number; nome: string; matricula: string }
        >;
      }
    >();

    (slotsEquipe || []).forEach(slot => {
      const dataSlot = dayjs(slot.data).startOf('day');
      const key = dataSlot.format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, {
          data: dataSlot.toDate(),
          eletricistas: new Map(),
        });
      }
      const info = map.get(key)!;
      info.eletricistas.set(slot.eletricista.id, {
        id: slot.eletricista.id,
        nome: slot.eletricista.nome,
        matricula: slot.eletricista.matricula,
      });
    });

    return map;
  }, [slotsEquipe]);

  const turnosPorDia = useMemo(() => {
    const map = new Map<string, TurnoEquipeRow[]>();
    (turnosEquipe || []).forEach(turno => {
      const key = dayjs(turno.dataInicio).format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(turno);
    });
    return map;
  }, [turnosEquipe]);

  const linhasEquipe = useMemo(() => {
    const rows: TurnoEquipeHistoricoRow[] = [];

    (turnosEquipe || []).forEach(turno => {
      const keyDia = dayjs(turno.dataInicio).format('YYYY-MM-DD');
      const escalados = slotsPorDia.get(keyDia);
      rows.push({
        key: String(turno.id),
        data: dayjs(turno.dataInicio).toDate(),
        dataInicio: turno.dataInicio,
        dataFim: turno.dataFim,
        veiculoPlaca: turno.veiculoPlaca,
        veiculoModelo: turno.veiculoModelo,
        equipeNome: turno.equipeNome,
        eletricistasAbertura: turno.eletricistas || [],
        eletricistasEscala: escalados
          ? Array.from(escalados.eletricistas.values())
          : [],
        status: turno.dataFim ? 'FECHADO' : 'ABERTO',
        turnoId: turno.id,
      });
    });

    slotsPorDia.forEach((slotInfo, keyDia) => {
      if (!turnosPorDia.has(keyDia)) {
        rows.push({
          key: `previsto-${keyDia}`,
          data: slotInfo.data,
          eletricistasAbertura: [],
          eletricistasEscala: Array.from(slotInfo.eletricistas.values()),
          status: 'PREVISTO',
        });
      }
    });

    return rows.sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [turnosEquipe, slotsPorDia, turnosPorDia]);

  const resumoEquipe = useMemo(() => {
    const lista = turnosEquipe || [];
    const abertos = lista.filter(turno => !turno.dataFim).length;
    const total = lista.length;
    const diasComEscala = slotsPorDia.size;
    const diasComAbertura = turnosPorDia.size;
    const previstosSemAbertura = Array.from(slotsPorDia.keys()).filter(
      dia => !turnosPorDia.has(dia)
    ).length;

    return {
      total,
      abertos,
      fechados: total - abertos,
      diasComEscala,
      diasComAbertura,
      previstosSemAbertura,
    };
  }, [turnosEquipe, slotsPorDia, turnosPorDia]);

  const resumoVeiculo = useMemo(() => {
    const lista = turnosEquipe || [];
    const equipesUnicas = new Set<string>();
    const eletricistasUnicos = new Map<number, { nome: string; matricula: string }>();

    lista.forEach((turno) => {
      if (turno.equipeNome) {
        equipesUnicas.add(turno.equipeNome);
      }

      (turno.eletricistas || []).forEach((eletricista) => {
        eletricistasUnicos.set(eletricista.id, {
          nome: eletricista.nome,
          matricula: eletricista.matricula,
        });
      });
    });

    return {
      equipes: Array.from(equipesUnicas).sort(),
      eletricistas: Array.from(eletricistasUnicos.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome)
      ),
    };
  }, [turnosEquipe]);

  const colunasEquipe: ColumnsType<TurnoEquipeHistoricoRow> = useMemo(
    () => [
      {
        title: 'Data',
        dataIndex: 'data',
        key: 'data',
        render: (_: Date, record) =>
          record.status === 'PREVISTO'
            ? dayjs(record.data).format('DD/MM/YYYY')
            : dayjs(record.dataInicio).format('DD/MM/YYYY HH:mm'),
        sorter: (a, b) => a.data.getTime() - b.data.getTime(),
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Prefixo',
        key: 'prefixo',
        render: (_: unknown, record) => {
          if (!record.veiculoPlaca) return '-';
          const prefixo = record.veiculoPlaca.split('-')[0];
          return prefixo || '-';
        },
      },
      {
        title: 'Escalados',
        key: 'escalados',
        render: (_: unknown, record) => {
          if (
            !record.eletricistasEscala ||
            record.eletricistasEscala.length === 0
          ) {
            return <Tag color='default'>Sem escala</Tag>;
          }
          return (
            <Space direction='vertical' size={0}>
              {record.eletricistasEscala.map(eletricista => (
                <span key={eletricista.id}>
                  {eletricista.nome} ({eletricista.matricula})
                </span>
              ))}
            </Space>
          );
        },
      },
      {
        title: 'Abriram',
        key: 'abriram',
        render: (_: unknown, record) => {
          if (
            !record.eletricistasAbertura ||
            record.eletricistasAbertura.length === 0
          ) {
            return record.status === 'PREVISTO' ? '-' : 'Sem eletricistas';
          }
          return (
            <Space direction='vertical' size={0}>
              {record.eletricistasAbertura.map(eletricista => {
                const isEscalado = record.eletricistasEscala?.some(
                  e => e.id === eletricista.id
                );
                return (
                  <span
                    key={eletricista.id}
                    style={!isEscalado ? { color: '#ff4d4f' } : undefined}
                    title={!isEscalado ? 'Não estava na escala' : undefined}
                  >
                    {eletricista.nome} ({eletricista.matricula})
                  </span>
                );
              })}
            </Space>
          );
        },
      },
      {
        title: 'Veículo',
        key: 'veiculo',
        render: (_: unknown, record) =>
          record.veiculoPlaca
            ? `${record.veiculoPlaca}${record.veiculoModelo ? ` - ${record.veiculoModelo}` : ''}`
            : '-',
      },
      {
        title: 'Equipe',
        key: 'equipe',
        dataIndex: 'equipeNome',
        render: (value: string | undefined) => value || '-',
      },
      {
        title: 'Status',
        key: 'status',
        render: (_: unknown, record) => {
          const status =
            record.status === 'PREVISTO'
              ? 'PREVISTO'
              : record.dataFim
                ? 'FECHADO'
                : 'ABERTO';
          return (
            <Tag
              color={
                status === 'ABERTO'
                  ? 'green'
                  : status === 'PREVISTO'
                    ? 'blue'
                    : 'default'
              }
            >
              {status}
            </Tag>
          );
        },
      },
      {
        title: 'Checklist',
        key: 'checklist',
        render: (_: unknown, record) => {
          if (record.status === 'PREVISTO' || !record.turnoId) {
            return <Tag color='default'>Previsto</Tag>;
          }
          const turnoId = record.turnoId;
          return (
            <Button
              size='small'
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTurnoEquipe({
                  id: turnoId,
                  dataInicio: record.dataInicio || record.data,
                  dataFim: record.dataFim,
                  veiculoPlaca: record.veiculoPlaca,
                  veiculoModelo: record.veiculoModelo,
                  equipeNome: record.equipeNome,
                  eletricistas: record.eletricistasAbertura,
                });
                setChecklistSelectorVisible(true);
              }}
            >
              Checklists
            </Button>
          );
        },
      },
    ],
    []
  );

  const loadingEquipeResumo = loadingEquipe || loadingEscalaEquipe;
  const hasErroEquipe = Boolean(errorEquipe || errorEscalaEquipe);

  return (
    <div style={{ padding: '24px' }}>
      {/* ✅ Card de Filtros - Eletricista */}
      <Card
        size='small'
        title={
          <Space>
            <FilterOutlined />
            <span>Filtros de Eletricista</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div
              style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}
            >
              Eletricista
            </div>
            <Select
              placeholder='Selecione o eletricista'
              showSearch
              allowClear
              style={{ width: '100%' }}
              loading={loadingEletricistas}
              value={eletricistaId}
              onChange={value => setEletricistaId(value)}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={
                Array.isArray(eletricistas)
                  ? eletricistas.map(e => ({
                      value: e.id,
                      label: e.matricula ? `${e.nome} (${e.matricula})` : e.nome,
                    }))
                  : []
              }
              suffixIcon={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div
              style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}
            >
              Período
            </div>
            <RangePicker
              value={
                dataInicio && dataFim
                  ? [dayjs(dataInicio), dayjs(dataFim)]
                  : null
              }
              onChange={handleRangeChange}
              format='DD/MM/YYYY'
              placeholder={['Data início', 'Data fim']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col
            xs={24}
            sm={12}
            md={8}
            style={{ display: 'flex', alignItems: 'flex-end' }}
          >
            <Button
              type='primary'
              onClick={handleBuscar}
              loading={loadingConsolidado}
              disabled={!eletricistaId || !dataInicio || !dataFim}
              style={{ width: '100%' }}
            >
              Buscar
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <CalendarOutlined />
            Visão Geral de Frequência
          </Space>
        }
      >
        {/* ✅ Filtro de Status (client-side) */}
        {consolidado && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span style={{ fontWeight: 500 }}>Filtrar por Status:</span>
              <Select
                placeholder='Todos os status'
                allowClear
                style={{ width: 200 }}
                value={filtroStatus}
                onChange={value => setFiltroStatus(value || undefined)}
              >
                <Select.Option value='trabalho'>Trabalho</Select.Option>
                <Select.Option value='falta'>Falta</Select.Option>
                <Select.Option value='atestado'>Atestado</Select.Option>
                <Select.Option value='hora_extra'>Hora Extra</Select.Option>
                <Select.Option value='folga'>Folga</Select.Option>
              </Select>
              {filtroStatus && (
                <Tag
                  color='blue'
                  closable
                  onClose={() => setFiltroStatus(undefined)}
                >
                  {filtroStatus === 'trabalho' && 'Trabalho'}
                  {filtroStatus === 'falta' && 'Falta'}
                  {filtroStatus === 'atestado' && 'Atestado'}
                  {filtroStatus === 'hora_extra' && 'Hora Extra'}
                  {filtroStatus === 'folga' && 'Folga'} (
                  {detalhamentoFiltrado.length} dia
                  {detalhamentoFiltrado.length !== 1 ? 's' : ''})
                </Tag>
              )}
            </Space>
          </div>
        )}
        {!eletricistaId || !dataInicio || !dataFim ? (
          <Empty
            description='Selecione um eletricista e período para visualizar os dados'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : loadingConsolidado && !consolidado ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '50px',
            }}
          >
            <Spin size='large' />
          </div>
        ) : error && !consolidado ? (
          <Card>
            <p style={{ color: 'red' }}>
              Erro ao carregar dados: {error.message}
            </p>
          </Card>
        ) : consolidado ? (
          <>
            {/* Informações do Eletricista e Período */}
            <Card
              size='small'
              style={{ marginBottom: 24, backgroundColor: '#f5f5f5' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title='Eletricista'
                    value={consolidado.eletricista.nome}
                    prefix={<UserOutlined />}
                    suffix={
                      <Tag color='blue'>
                        {consolidado.eletricista.matricula}
                      </Tag>
                    }
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title='Período'
                    value={`${dayjs(consolidado.periodo.dataInicio).format('DD/MM/YYYY')} - ${dayjs(consolidado.periodo.dataFim).format('DD/MM/YYYY')}`}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Resumo Consolidado */}
            <Card title='Resumo Consolidado' style={{ marginBottom: 24 }}>
              <ConsolidadoEletricistaCard
                resumo={consolidado.resumo}
                loading={loadingConsolidado}
              />
            </Card>

            {/* Estatísticas Detalhadas */}
            {estatisticasDetalhadas && (
              <Card
                title='Estatísticas Detalhadas'
                style={{ marginBottom: 24 }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Dias Trabalhados'
                        value={estatisticasDetalhadas.trabalhados}
                        suffix='dias'
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Faltas'
                        value={estatisticasDetalhadas.faltas}
                        suffix='dias'
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Atestados'
                        value={estatisticasDetalhadas.atestados}
                        suffix='dias'
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Horas Extras'
                        value={estatisticasDetalhadas.horasExtras}
                        suffix='dias'
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Folgas'
                        value={estatisticasDetalhadas.folgas}
                        suffix='dias'
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Horas Previstas'
                        value={estatisticasDetalhadas.totalHorasPrevistas.toFixed(
                          1
                        )}
                        suffix='h'
                        valueStyle={{ color: '#595959' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Horas Realizadas'
                        value={estatisticasDetalhadas.totalHorasRealizadas.toFixed(
                          1
                        )}
                        suffix='h'
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size='small'>
                      <Statistic
                        title='Diferença'
                        value={(
                          estatisticasDetalhadas.totalHorasRealizadas -
                          estatisticasDetalhadas.totalHorasPrevistas
                        ).toFixed(1)}
                        suffix='h'
                        valueStyle={{
                          color:
                            estatisticasDetalhadas.totalHorasRealizadas -
                              estatisticasDetalhadas.totalHorasPrevistas >=
                            0
                              ? '#3f8600'
                              : '#cf1322',
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Calendário de Frequência */}
            <Card title='Calendário de Frequência' style={{ marginBottom: 24 }}>
              <CalendarioFrequencia
                consolidado={{
                  ...consolidado,
                  detalhamento: detalhamentoFiltrado,
                }}
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </Card>

            {/* Histórico Detalhado */}
            <Card title='Histórico Detalhado por Dia'>
              <HistoricoTable
                dados={detalhamentoFiltrado}
                loading={loadingConsolidado}
              />
            </Card>
          </>
        ) : null}
      </Card>

      {/* ✅ Card de Filtros - Equipes */}
      <Card
        size='small'
        title={
          <Space>
            <FilterOutlined />
            <span>Filtros de Equipes</span>
          </Space>
        }
        style={{ marginTop: '24px', marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div
              style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}
            >
              Equipe
            </div>
            <Select
              placeholder='Selecione a equipe (opcional)'
              showSearch
              allowClear
              style={{ width: '100%' }}
              loading={loadingEquipes}
              value={equipeId}
              onChange={value => setEquipeId(value)}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={
                Array.isArray(equipes)
                  ? equipes.map(e => ({
                      value: e.id,
                      label: e.nome,
                    }))
                  : []
              }
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div
              style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}
            >
              Veículo (Placa)
            </div>
            <Select
              placeholder='Selecione a placa (opcional)'
              showSearch
              allowClear
              style={{ width: '100%' }}
              loading={loadingVeiculos}
              value={veiculoId}
              onChange={value => setVeiculoId(value)}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={
                Array.isArray(veiculos)
                  ? veiculos.map(v => ({
                      value: v.id,
                      label: v.modelo
                        ? `${v.placa} - ${v.modelo}`
                        : v.placa,
                    }))
                  : []
              }
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div
              style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}
            >
              Período
            </div>
            <RangePicker
              value={
                dataInicioEquipe && dataFimEquipe
                  ? [dayjs(dataInicioEquipe), dayjs(dataFimEquipe)]
                  : null
              }
              onChange={handleRangeChangeEquipe}
              format='DD/MM/YYYY'
              placeholder={['Data início', 'Data fim']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              type='primary'
              onClick={handleBuscarEquipe}
              loading={loadingEquipeResumo}
              disabled={(!equipeId && !veiculoId) || !dataInicioEquipe || !dataFimEquipe}
              style={{ width: '100%' }}
            >
              Buscar
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <TeamOutlined />
            Visão Geral de Equipes e Veículos
          </Space>
        }
      >
        {(!equipeId && !veiculoId) || !dataInicioEquipe || !dataFimEquipe ? (
          <Empty
            description='Selecione equipe ou veículo e período para visualizar os dados'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : loadingEquipeResumo && linhasEquipe.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '50px',
            }}
          >
            <Spin size='large' />
          </div>
        ) : hasErroEquipe && linhasEquipe.length === 0 ? (
          <Card>
            <p style={{ color: 'red' }}>
              Erro ao carregar dados:{' '}
              {(errorEquipe || errorEscalaEquipe)?.message}
            </p>
          </Card>
        ) : (
          <>
            <Card
              size='small'
              style={{ marginBottom: 24, backgroundColor: '#f5f5f5' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Turnos Abertos'
                    value={resumoEquipe.abertos}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Turnos Fechados'
                    value={resumoEquipe.fechados}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Total no Período'
                    value={resumoEquipe.total}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Dias com Escala'
                    value={resumoEquipe.diasComEscala}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Dias com Abertura'
                    value={resumoEquipe.diasComAbertura}
                  />
                </Col>
                <Col xs={24} sm={8} md={4}>
                  <Statistic
                    title='Previstos sem Abertura'
                    value={resumoEquipe.previstosSemAbertura}
                  />
                </Col>
              </Row>
            </Card>

            {veiculoId && (
              <Card
                size='small'
                title='Equipes e Eletricistas que Usaram o Veículo no Período'
                style={{ marginBottom: 24 }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>
                      Equipes ({resumoVeiculo.equipes.length})
                    </div>
                    <Space wrap>
                      {resumoVeiculo.equipes.length > 0 ? (
                        resumoVeiculo.equipes.map((nomeEquipe) => (
                          <Tag key={nomeEquipe} color='blue'>
                            {nomeEquipe}
                          </Tag>
                        ))
                      ) : (
                        <Tag color='default'>Nenhuma equipe no período</Tag>
                      )}
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>
                      Eletricistas ({resumoVeiculo.eletricistas.length})
                    </div>
                    <Space wrap>
                      {resumoVeiculo.eletricistas.length > 0 ? (
                        resumoVeiculo.eletricistas.map((eletricista) => (
                          <Tag
                            key={`${eletricista.matricula}-${eletricista.nome}`}
                            color='geekblue'
                          >
                            {eletricista.nome} ({eletricista.matricula})
                          </Tag>
                        ))
                      ) : (
                        <Tag color='default'>Nenhum eletricista no período</Tag>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            )}

            <Card title='Histórico de Turnos da Equipe'>
              <Table
                columns={colunasEquipe}
                dataSource={linhasEquipe}
                rowKey='key'
                pagination={{ pageSize: 10 }}
                size='small'
              />
            </Card>
          </>
        )}
      </Card>

      <ChecklistSelectorModal
        visible={checklistSelectorVisible}
        onClose={handleCloseChecklistSelector}
        turnoId={selectedTurnoEquipe?.id || 0}
        turnoInfo={{
          veiculoPlaca: selectedTurnoEquipe?.veiculoPlaca || '',
          equipeNome: selectedTurnoEquipe?.equipeNome || '',
          dataInicio: selectedTurnoEquipe?.dataInicio
            ? String(selectedTurnoEquipe.dataInicio)
            : '',
        }}
        onSelectChecklist={handleSelectChecklist}
      />

      <ChecklistViewerModal
        visible={checklistViewerVisible}
        onClose={handleCloseChecklistViewer}
        checklist={selectedChecklist}
      />
    </div>
  );
}
