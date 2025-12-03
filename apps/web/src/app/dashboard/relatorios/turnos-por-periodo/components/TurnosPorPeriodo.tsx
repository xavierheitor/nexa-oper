'use client';

/**
 * Componente de Relatório de Turnos por Período
 *
 * Exibe:
 * - Gráfico de barras empilhadas: quantidade de turnos por tipo de equipe por dia
 * - Matriz: turnos por hora de abertura (arredondado em 15min) e por dia, com filtro por tipo de equipe
 * - Tabela: dados detalhados (placa, equipe, eletricistas, hora abertura, hora final)
 */

import { useState, useMemo } from 'react';
import {
  Card,
  Empty,
  Spin,
  Typography,
  Space,
  Select,
  Table,
  Tag,
  Tooltip,
  Input,
  Button,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { BarChartOutlined, TeamOutlined, CarOutlined, ClockCircleOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { getTextFilter, getSelectFilter } from '@/ui/components/tableFilters';

const { Title, Text } = Typography;

interface TurnoData {
  id: number;
  dataInicio: Date | string;
  dataFim: Date | string | null;
  placa: string;
  equipeNome: string;
  tipoEquipeNome: string;
  tipoEquipeId: number | null;
  eletricistas: Array<{
    id: number;
    nome: string;
    matricula: string | null;
  }>;
}

interface TurnosPorPeriodoProps {
  filtros?: {
    periodoInicio: Date;
    periodoFim: Date;
    baseId?: number;
    contratoId?: number;
  };
}

/**
 * Arredonda hora para o intervalo de 15 minutos mais próximo
 * Exemplos: 08:07 -> 08:00, 08:08 -> 08:15, 08:23 -> 08:15, 08:38 -> 08:45, 08:52 -> 09:00
 */
function arredondarHora15Minutos(data: Date): string {
  const minutos = data.getMinutes();
  const hora = data.getHours();

  // Arredondar para o múltiplo de 15 mais próximo
  const arredondado = Math.round(minutos / 15) * 15;

  // Se arredondado for 60, vai para a próxima hora e zera os minutos
  if (arredondado >= 60) {
    const horaFinal = (hora + 1) % 24; // Garantir que não passe de 23:59
    return `${String(horaFinal).padStart(2, '0')}:00`;
  }

  return `${String(hora).padStart(2, '0')}:${String(arredondado).padStart(2, '0')}`;
}

/**
 * Formata data para chave única (YYYY-MM-DD)
 */
function formatarData(data: Date | string): string {
  return dayjs(data).format('YYYY-MM-DD');
}

/**
 * Formata hora para exibição (HH:mm)
 */
function formatarHora(data: Date | string): string {
  return dayjs(data).format('HH:mm');
}

export default function TurnosPorPeriodo({ filtros }: TurnosPorPeriodoProps) {
  const [tipoEquipeFiltro, setTipoEquipeFiltro] = useState<number | undefined>(undefined);

  // Hook para paginação client-side
  const { pagination } = useTablePagination({
    defaultPageSize: 20,
    showTotal: (total) => `Total: ${total} turno(s)`,
  });

  // Buscar tipos de equipe para filtro
  const { data: tiposEquipe, isLoading: loadingTiposEquipe } = useEntityData({
    key: 'turnos-por-periodo-tipos-equipe',
    fetcherAction: async (params) => {
      const result = await listTiposEquipe({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
        ...params,
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  // Buscar turnos do período
  const { data: turnosRaw, loading } = useDataFetch<TurnoData[]>(
    async () => {
      if (!filtros?.periodoInicio || !filtros?.periodoFim) {
        return [];
      }

      const { getTurnosPorPeriodo } = await import(
        '@/lib/actions/relatorios/relatoriosTurnos'
      );
      const result = await getTurnosPorPeriodo({
        periodoInicio: filtros.periodoInicio,
        periodoFim: filtros.periodoFim,
        baseId: filtros.baseId,
        contratoId: filtros.contratoId,
        tipoEquipeId: tipoEquipeFiltro,
      });

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de turnos por período');
    },
    [filtros?.periodoInicio, filtros?.periodoFim, filtros?.baseId, filtros?.contratoId, tipoEquipeFiltro]
  );

  const turnos: TurnoData[] = turnosRaw || [];

  // Filtrar turnos por tipo de equipe se necessário (para matriz e tabela)
  const turnosFiltrados = useMemo(() => {
    if (!tipoEquipeFiltro) return turnos;
    return turnos.filter((t) => t.tipoEquipeId === tipoEquipeFiltro);
  }, [turnos, tipoEquipeFiltro]);

  // Gerar lista de dias do período (deve vir antes de dadosGrafico)
  const diasPeriodo = useMemo(() => {
    if (!filtros?.periodoInicio || !filtros?.periodoFim) return [];
    const dias: string[] = [];
    let dataAtual = dayjs(filtros.periodoInicio);
    const dataFim = dayjs(filtros.periodoFim);

    while (dataAtual.isBefore(dataFim) || dataAtual.isSame(dataFim, 'day')) {
      dias.push(dataAtual.format('YYYY-MM-DD'));
      dataAtual = dataAtual.add(1, 'day');
    }
    return dias;
  }, [filtros?.periodoInicio, filtros?.periodoFim]);

  // Preparar dados para gráfico de barras empilhadas (por dia e tipo de equipe)
  const dadosGrafico = useMemo(() => {
    // Primeiro, coletar todos os tipos de equipe que aparecem nos turnos
    const tipos = new Set<string>();
    turnos.forEach((turno) => {
      const tipo = turno.tipoEquipeNome || 'Sem classificação';
      tipos.add(tipo);
    });

    // Inicializar estrutura com todos os dias do período e todos os tipos
    const porDiaETipo: Record<string, Record<string, number>> = {};

    // Garantir que todos os dias do período estejam presentes
    diasPeriodo.forEach((dia) => {
      if (!porDiaETipo[dia]) {
        porDiaETipo[dia] = {};
      }
      // Inicializar todos os tipos com 0 para cada dia
      tipos.forEach((tipo) => {
        if (!porDiaETipo[dia][tipo]) {
          porDiaETipo[dia][tipo] = 0;
        }
      });
    });

    // Contar turnos por dia e tipo
    turnos.forEach((turno) => {
      const dia = formatarData(turno.dataInicio);
      const tipo = turno.tipoEquipeNome || 'Sem classificação';

      if (!porDiaETipo[dia]) {
        porDiaETipo[dia] = {};
      }
      if (!porDiaETipo[dia][tipo]) {
        porDiaETipo[dia][tipo] = 0;
      }
      porDiaETipo[dia][tipo]++;
    });

    // Converter para formato do gráfico (incluindo dias sem turnos)
    const dados: Array<{ dia: string; diaFormatado: string; tipo: string; quantidade: number }> = [];

    // Se não há tipos de equipe, criar um tipo fictício para garantir que os dias apareçam
    if (tipos.size === 0) {
      tipos.add('Sem turnos');
    }

    const tiposArray = Array.from(tipos);
    const primeiroTipoReal = tiposArray.find((t) => t !== 'Sem turnos') || tiposArray[0];

    // Iterar por todos os dias do período
    diasPeriodo.forEach((dia) => {
      let diaTemTurnos = false;
      // Formatar dia para exibição (DD/MM)
      const diaFormatado = dayjs(dia).format('DD/MM');

      // Primeiro, adicionar todos os tipos que têm turnos neste dia
      tiposArray.forEach((tipo) => {
        const quantidade = porDiaETipo[dia]?.[tipo] || 0;
        if (quantidade > 0) {
          dados.push({ dia, diaFormatado, tipo, quantidade });
          diaTemTurnos = true;
        }
      });

      // Se o dia não tem nenhum turno, adicionar entrada com quantidade 0
      // usando um tipo que não aparecerá na legenda (vamos filtrar depois)
      if (!diaTemTurnos) {
        // Usar um tipo especial que será filtrado da legenda
        dados.push({ dia, diaFormatado, tipo: primeiroTipoReal, quantidade: 0 });
      }
    });

    // Filtrar tipos que não têm dados para não aparecerem na legenda
    const tiposComDados = tiposArray.filter((tipo) => {
      if (tipo === 'Sem turnos') return false;
      return dados.some((d) => d.tipo === tipo && d.quantidade > 0);
    });

    return { dados, tipos: tiposComDados, dias: diasPeriodo };
  }, [turnos, diasPeriodo]);

  // Preparar dados para matriz (hora de abertura x dia)
  const dadosMatriz = useMemo(() => {
    const matriz: Record<string, Record<string, number>> = {};

    turnosFiltrados.forEach((turno) => {
      const dia = formatarData(turno.dataInicio);
      const horaAbertura = arredondarHora15Minutos(
        turno.dataInicio instanceof Date ? turno.dataInicio : new Date(turno.dataInicio)
      );

      if (!matriz[horaAbertura]) {
        matriz[horaAbertura] = {};
      }
      if (!matriz[horaAbertura][dia]) {
        matriz[horaAbertura][dia] = 0;
      }
      matriz[horaAbertura][dia]++;
    });

    return matriz;
  }, [turnosFiltrados]);

  // Gerar lista de horas (00:00 a 23:45 em intervalos de 15min)
  const horas = useMemo(() => {
    const horasList: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        horasList.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return horasList;
  }, []);

  // Filtrar horas que realmente têm dados
  const horasComDados = useMemo(() => {
    return horas.filter((hora) => dadosMatriz[hora] && Object.keys(dadosMatriz[hora]).length > 0);
  }, [horas, dadosMatriz]);

  // Gerar cores para cada tipo de equipe
  const coresGrafico = useMemo(() => {
    const cores: Record<string, string> = {};
    const coresDisponiveis = [
      '#1890ff',
      '#52c41a',
      '#faad14',
      '#f5222d',
      '#722ed1',
      '#13c2c2',
      '#eb2f96',
      '#fa8c16',
    ];
    dadosGrafico.tipos.forEach((tipo, index) => {
      cores[tipo] = coresDisponiveis[index % coresDisponiveis.length];
    });
    return cores;
  }, [dadosGrafico.tipos]);

  // Preparar opções de filtro únicas para colunas de seleção
  const opcoesFiltro = useMemo(() => {
    const equipes = new Set<string>();
    const tiposEquipe = new Set<string>();
    const datas = new Set<string>();

    turnosFiltrados.forEach((turno) => {
      if (turno.equipeNome) equipes.add(turno.equipeNome);
      if (turno.tipoEquipeNome) tiposEquipe.add(turno.tipoEquipeNome);
      const dataFormatada = dayjs(turno.dataInicio).format('DD/MM/YYYY');
      datas.add(dataFormatada);
    });

    return {
      equipes: Array.from(equipes).sort().map((nome) => ({ text: nome, value: nome })),
      tiposEquipe: Array.from(tiposEquipe).sort().map((nome) => ({ text: nome, value: nome })),
      datas: Array.from(datas).sort().map((data) => ({ text: data, value: data })),
    };
  }, [turnosFiltrados]);

  // Função para exportar dados para Excel (CSV)
  const handleExportarExcel = () => {
    // Cabeçalhos das colunas
    const headers = [
      'Placa',
      'Equipe',
      'Tipo de Equipe',
      'Eletricistas',
      'Data',
      'Hora Abertura',
      'Hora Final',
    ];

    // Converter dados para CSV
    const csvRows = [
      headers.join(';'), // Cabeçalho
      ...turnosFiltrados.map((turno) => {
        const eletricistas = turno.eletricistas
          .map((elet) => `${elet.nome}${elet.matricula ? ` (${elet.matricula})` : ''}`)
          .join(', ');
        const dataFormatada = dayjs(turno.dataInicio).format('DD/MM/YYYY');
        const horaAbertura = formatarHora(turno.dataInicio);
        const horaFinal = turno.dataFim ? formatarHora(turno.dataFim) : 'Em andamento';

        return [
          turno.placa || '',
          turno.equipeNome || '',
          turno.tipoEquipeNome || '',
          eletricistas,
          dataFormatada,
          horaAbertura,
          horaFinal,
        ].join(';');
      }),
    ];

    // Criar arquivo CSV
    const csvContent = csvRows.join('\n');

    // Adicionar BOM para UTF-8 (garante que Excel abra corretamente)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Criar link de download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Nome do arquivo com data atual
    const dataAtual = dayjs().format('DD-MM-YYYY_HH-mm');
    const periodoInicio = filtros?.periodoInicio ? dayjs(filtros.periodoInicio).format('DD-MM-YYYY') : '';
    const periodoFim = filtros?.periodoFim ? dayjs(filtros.periodoFim).format('DD-MM-YYYY') : '';
    const nomeArquivo = `turnos_por_periodo_${periodoInicio}_a_${periodoFim}_${dataAtual}.csv`;

    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Colunas da tabela
  const colunasTabela: ColumnsType<TurnoData> = [
    {
      title: 'Placa',
      dataIndex: 'placa',
      key: 'placa',
      width: 100,
      render: (placa: string) => (
        <Space>
          <CarOutlined />
          <Text strong>{placa}</Text>
        </Space>
      ),
      ...getTextFilter<TurnoData>('placa', 'placa'),
    },
    {
      title: 'Equipe',
      dataIndex: 'equipeNome',
      key: 'equipeNome',
      width: 150,
      render: (equipeNome: string, record: TurnoData) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {equipeNome}
        </Tag>
      ),
      ...getSelectFilter<TurnoData>('equipeNome', opcoesFiltro.equipes),
    },
    {
      title: 'Tipo de Equipe',
      dataIndex: 'tipoEquipeNome',
      key: 'tipoEquipeNome',
      width: 150,
      render: (tipo: string) => (
        <Tag color="purple">{tipo}</Tag>
      ),
      ...getSelectFilter<TurnoData>('tipoEquipeNome', opcoesFiltro.tiposEquipe),
    },
    {
      title: 'Eletricistas',
      dataIndex: 'eletricistas',
      key: 'eletricistas',
      width: 200,
      render: (eletricistas: TurnoData['eletricistas']) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {eletricistas.map((elet) => (
            <Text key={elet.id}>
              {elet.nome}
              {elet.matricula && <Text type="secondary"> ({elet.matricula})</Text>}
            </Text>
          ))}
        </Space>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Buscar eletricista"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Buscar
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Limpar
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : '#8c8c8c' }} />
      ),
      onFilter: (value: any, record: TurnoData) => {
        const searchText = value.toString().toLowerCase();
        return record.eletricistas.some(
          (elet) =>
            elet.nome.toLowerCase().includes(searchText) ||
            (elet.matricula && elet.matricula.toLowerCase().includes(searchText))
        );
      },
    },
    {
      title: 'Hora Abertura',
      dataIndex: 'dataInicio',
      key: 'dataInicio',
      width: 120,
      render: (dataInicio: Date | string) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{formatarHora(dataInicio)}</Text>
        </Space>
      ),
      sorter: (a, b) => {
        const dataA = a.dataInicio instanceof Date ? a.dataInicio : new Date(a.dataInicio);
        const dataB = b.dataInicio instanceof Date ? b.dataInicio : new Date(b.dataInicio);
        return dataA.getTime() - dataB.getTime();
      },
      ...getTextFilter<TurnoData>('dataInicio', 'hora de abertura'),
      onFilter: (value: any, record: TurnoData) => {
        const horaFormatada = formatarHora(record.dataInicio);
        return horaFormatada.toLowerCase().includes(value.toString().toLowerCase());
      },
    },
    {
      title: 'Hora Final',
      dataIndex: 'dataFim',
      key: 'dataFim',
      width: 120,
      render: (dataFim: Date | string | null) => {
        if (!dataFim) {
          return <Tag color="orange">Em andamento</Tag>;
        }
        return (
          <Space>
            <ClockCircleOutlined />
            <Text>{formatarHora(dataFim)}</Text>
          </Space>
        );
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Buscar hora final"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Buscar
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Limpar
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : '#8c8c8c' }} />
      ),
      onFilter: (value: any, record: TurnoData) => {
        if (!record.dataFim) {
          return 'em andamento'.includes(value.toString().toLowerCase());
        }
        const horaFormatada = formatarHora(record.dataFim);
        return horaFormatada.toLowerCase().includes(value.toString().toLowerCase());
      },
    },
    {
      title: 'Data',
      dataIndex: 'dataInicio',
      key: 'data',
      width: 120,
      render: (dataInicio: Date | string) => dayjs(dataInicio).format('DD/MM/YYYY'),
      sorter: (a, b) => {
        const dataA = a.dataInicio instanceof Date ? a.dataInicio : new Date(a.dataInicio);
        const dataB = b.dataInicio instanceof Date ? b.dataInicio : new Date(b.dataInicio);
        return dataA.getTime() - dataB.getTime();
      },
      defaultSortOrder: 'ascend' as const,
      ...getSelectFilter<TurnoData>('dataInicio', opcoesFiltro.datas),
      onFilter: (value: any, record: TurnoData) => {
        const dataFormatada = dayjs(record.dataInicio).format('DD/MM/YYYY');
        return dataFormatada === value;
      },
    },
  ];

  if (!filtros?.periodoInicio || !filtros?.periodoFim) {
    return (
      <Card title={<Space><BarChartOutlined /><span>Turnos por Período</span></Space>}>
        <Empty description="Selecione um período para visualizar os turnos" />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title={<Space><BarChartOutlined /><span>Turnos por Período</span></Space>}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Não retornar Empty aqui - vamos mostrar o gráfico mesmo sem turnos para exibir todos os dias

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Gráfico de Barras Empilhadas */}
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Quantidade de Turnos por Tipo de Equipe e Dia</span>
          </Space>
        }
      >
        {dadosGrafico.dados.length === 0 && diasPeriodo.length === 0 ? (
          <Empty description="Selecione um período para visualizar o gráfico" />
        ) : (
          <Column
            data={dadosGrafico.dados.filter((d) => {
              // Garantir que os dados são válidos
              return d && typeof d.quantidade === 'number' && !isNaN(d.quantidade);
            })}
            xField="diaFormatado"
            yField="quantidade"
            seriesField="tipo"
            isStack={true}
            height={400}
            label={{
              text: 'quantidade',
              position: 'top',
              style: {
                fill: '#000',
                fontWeight: 'bold',
              },
            }}
            color={({ tipo, quantidade }: { tipo: string; quantidade: number }) => {
              // Não mostrar cor quando quantidade for 0 - barra invisível mas dia aparece no eixo X
              if (quantidade === 0) return 'transparent';
              if (tipo === 'Sem turnos') return 'transparent';
              return coresGrafico[tipo] || '#d9d9d9';
            }}
            xAxis={{
              label: {
                autoRotate: true,
                autoHide: false,
              },
              type: 'category',
            }}
            legend={{
              position: 'top',
            }}
            yAxis={{
              tickCount: 5,
              label: {
                formatter: (text: string) => {
                  const num = parseFloat(text);
                  return Number.isInteger(num) ? num.toString() : '';
                },
              },
            }}
          />
        )}
      </Card>

      {/* Matriz de Turnos por Hora de Abertura */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Matriz de Turnos por Hora de Abertura e Dia</span>
          </Space>
        }
        extra={
          <Select
            placeholder="Filtrar por Tipo de Equipe"
            style={{ width: 250 }}
            allowClear
            loading={loadingTiposEquipe}
            value={tipoEquipeFiltro}
            onChange={setTipoEquipeFiltro}
            options={tiposEquipe?.map((tipo: any) => ({
              label: tipo.nome,
              value: tipo.id,
            }))}
          />
        }
      >
        {horasComDados.length === 0 ? (
          <Empty description="Nenhum turno encontrado" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table
              dataSource={horasComDados.map((hora) => ({
                key: hora,
                hora,
                ...dadosMatriz[hora],
              }))}
              columns={[
                {
                  title: 'Hora',
                  dataIndex: 'hora',
                  key: 'hora',
                  width: 100,
                  fixed: 'left' as const,
                  render: (hora: string) => <Text strong>{hora}</Text>,
                },
                ...diasPeriodo.map((dia) => ({
                  title: dayjs(dia).format('DD/MM'),
                  dataIndex: dia,
                  key: dia,
                  width: 80,
                  align: 'center' as const,
                  render: (valor: number | undefined) => {
                    if (valor === undefined || valor === 0) {
                      return <Text type="secondary">-</Text>;
                    }
                    return (
                      <Tooltip title={`${valor} turno(s)`}>
                        <Tag color="blue">{valor}</Tag>
                      </Tooltip>
                    );
                  },
                })),
              ]}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </div>
        )}
      </Card>

      {/* Tabela Detalhada */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Detalhamento de Turnos</span>
            {tipoEquipeFiltro && (
              <Tag color="purple" closable onClose={() => setTipoEquipeFiltro(undefined)}>
                Filtrado por tipo de equipe
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="default"
              icon={<FileExcelOutlined />}
              onClick={handleExportarExcel}
              disabled={turnosFiltrados.length === 0}
            >
              Exportar Excel
            </Button>
            <Text type="secondary">
              Total: <Text strong>{turnosFiltrados.length}</Text> turno(s)
            </Text>
          </Space>
        }
      >
        <Table
          dataSource={turnosFiltrados}
          columns={colunasTabela}
          rowKey="id"
          pagination={pagination}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </Space>
  );
}

