/**
 * Página de Edição em Curso
 *
 * Mostra todas as escalas publicadas em formato de grade com células mescladas
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  DatePicker,
  Space,
  Table,
  Tag,
  Spin,
  Alert,
  Typography,
  Select,
  Input,
  Row,
  Col,
  Button,
  Modal,
  Form,
  App,
} from 'antd';
import {
  CalendarOutlined,
  SearchOutlined,
  EditOutlined,
  UserSwitchOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getEscalasPublicadasProcessadas } from '@/lib/actions/escala/getEscalasPublicadasProcessadas';
import {
  transferirEscala,
  updateSlotEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import {
  createEquipeTurnoHistorico,
  updateEquipeTurnoHistorico,
  buscarHorarioVigente,
} from '@/lib/actions/escala/equipeTurnoHistorico';
import { useCrudController } from '@/lib/hooks/useCrudController';
import EquipeTurnoHistoricoForm from '@/ui/pages/dashboard/escalas/equipe-horario/form';
import SubstituirEletricistaModal from '@/app/dashboard/escalas/edicao-em-curso/components/SubstituirEletricistaModal';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const equipeStripePalette = [
  'rgba(24, 144, 255, 0.05)',
  'rgba(82, 196, 26, 0.05)',
  'rgba(250, 173, 20, 0.05)',
  'rgba(245, 34, 45, 0.04)',
  'rgba(114, 46, 209, 0.05)',
  'rgba(19, 194, 194, 0.05)',
];

const getEquipeStripeColor = (equipeId: number) =>
  equipeStripePalette[Math.abs(equipeId) % equipeStripePalette.length];

const getEquipeCellStyle = (record: { equipeId: number }) => ({
  backgroundColor: getEquipeStripeColor(record.equipeId),
});

/** Converte estado do slot para letra no CSV: T=trabalho, F=folga, X=falta, E=exceção */
function estadoParaLetra(estado: string | null): string {
  if (!estado) return '';
  const map: Record<string, string> = {
    TRABALHO: 'T',
    FOLGA: 'F',
    FALTA: 'X',
    EXCECAO: 'E',
  };
  return map[estado] ?? estado;
}

/**
 * Exporta a escala visível (respeitando filtros de dia) para CSV.
 * Uma linha por eletricista; base, prefixo e horário repetidos em cada linha da equipe.
 */
function exportarEscalaCSV(
  tableData: any[],
  dias: Date[],
  filtrosDias: Record<string, string | null>
) {
  // Aplicar filtros por dia: só manter linhas que passam em todos os filtros ativos
  let linhas = tableData;
  const filtrosDiasEntries = Object.entries(filtrosDias).filter(
    ([, v]) => v != null && v !== ''
  );
  if (filtrosDiasEntries.length > 0) {
    linhas = tableData.filter(row => {
      return filtrosDiasEntries.every(
        ([diaKey, valor]) => row[diaKey] === valor
      );
    });
  }

  if (linhas.length === 0) {
    return { ok: false as const, error: 'Nenhum dado para exportar (filtros podem ter deixado a lista vazia).' };
  }

  const BOM = '\uFEFF';
  const sep = ';';

  // Cabeçalho: base, prefixo, horario, eletricista, matricula, depois um por dia
  const mesmoMes =
    dias.length > 0 &&
    dias.every(
      d =>
        d.getMonth() === dias[0].getMonth() &&
        d.getFullYear() === dias[0].getFullYear()
    );
  const headers = [
    'Base',
    'Prefixo',
    'Horário',
    'Eletricista',
    'Matrícula',
    ...dias.map(d =>
      mesmoMes ? String(d.getDate()) : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    ),
  ];

  const csvRows = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(sep),
    ...linhas.map(row => {
      const campos = [
        row.base ?? '',
        row.prefixo ?? '',
        row.horario ?? '',
        row.eletricista ?? '',
        row.matricula ?? '',
        ...dias.map(d => {
          const diaKey = d.toISOString().split('T')[0];
          return estadoParaLetra(row[diaKey] ?? null);
        }),
      ];
      return campos.map(f => `"${String(f).replace(/"/g, '""')}"`).join(sep);
    }),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dataStr = new Date().toISOString().slice(0, 10);
  const periodoStr =
    dias.length > 0
      ? `${dias[0].getDate().toString().padStart(2, '0')}-${(dias[0].getMonth() + 1).toString().padStart(2, '0')}_a_${dias[dias.length - 1].getDate().toString().padStart(2, '0')}-${(dias[dias.length - 1].getMonth() + 1).toString().padStart(2, '0')}`
      : dataStr;
  link.setAttribute('download', `escala_edicao_em_curso_${periodoStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return { ok: true as const };
}

interface Slot {
  id: number;
  data: Date;
  estado: 'TRABALHO' | 'FOLGA' | 'FALTA' | 'EXCECAO';
  eletricistaId: number;
  inicioPrevisto?: string | null;
  fimPrevisto?: string | null;
  anotacoesDia?: string | null;
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
}

export default function EdicaoEmCursoPage() {
  const { message } = App.useApp();
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [loading, setLoading] = useState(false);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [valoresUnicos, setValoresUnicos] = useState<{
    bases: string[];
    tiposEquipe: string[];
    equipes: string[];
    horarios: string[];
  }>({ bases: [], tiposEquipe: [], equipes: [], horarios: [] });

  // Estados dos filtros
  const [filtroBase, setFiltroBase] = useState<string | null>(null);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<string | null>(null);
  const [filtroEquipe, setFiltroEquipe] = useState<string | null>(null);
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroHorario, setFiltroHorario] = useState<string | null>(null);
  const [filtrosDias, setFiltrosDias] = useState<Record<string, string | null>>(
    {}
  );

  // Estados para modal de horário
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [equipeIdParaHorario, setEquipeIdParaHorario] = useState<number | null>(
    null
  );
  const [horarioVigenteEditando, setHorarioVigenteEditando] = useState<
    any | null
  >(null);
  const [loadingHorarioVigente, setLoadingHorarioVigente] = useState(false);
  const crudHorario = useCrudController<any>('equipeTurnoHistorico');

  // Estados para modal de edição de slot
  const [modalSlotOpen, setModalSlotOpen] = useState(false);
  const [slotEditando, setSlotEditando] = useState<{
    slotId: number;
    escalaId: number;
    eletricistaId: number;
    eletricistaNome: string;
    data: Date;
    estado: 'TRABALHO' | 'FOLGA' | 'FALTA' | 'EXCECAO';
    anotacoesDia?: string | null;
  } | null>(null);
  const [formSlot] = Form.useForm();
  const [loadingSlot, setLoadingSlot] = useState(false);

  // Estados para modal de transferência
  const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);
  const [transferenciaData, setTransferenciaData] = useState<{
    escalaId: number;
    eletricistaOrigemId: number;
    eletricistaOrigemNome: string;
  } | null>(null);
  const [loadingTransferencia, setLoadingTransferencia] = useState(false);
  const [formTransferencia] = Form.useForm();

  // Estado para dados de eletricistas
  const [eletricistasData, setEletricistasData] = useState<any>(null);

  // Estados para modal de substituição
  const [modalSubstituicaoOpen, setModalSubstituicaoOpen] = useState(false);
  const [dadosSubstituicao, setDadosSubstituicao] = useState<{
    escalaId: number;
    eletricistaSaiId: number;
    eletricistaSaiNome: string;
    periodoInicial: [Dayjs, Dayjs];
  } | null>(null);

  // Trigger para recarregar dados
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Carregar lista de eletricistas
  React.useEffect(() => {
    import('@/lib/actions/eletricista/list').then(({ listEletricistas }) => {
      listEletricistas({ limit: 1000 }).then(result => {
        if (result.success) {
          setEletricistasData(result.data);
        }
      });
    });
  }, []);

  // Carregar escalas quando o período ou filtros mudam
  React.useEffect(() => {
    const carregarEscalas = async () => {
      if (!periodo[0] || !periodo[1]) return;

      setLoading(true);

      try {
        const result = await getEscalasPublicadasProcessadas({
          periodoInicio: periodo[0].toDate(),
          periodoFim: periodo[1].toDate(),
          filtroBase: filtroBase || undefined,
          filtroTipoEquipe: filtroTipoEquipe || undefined,
          filtroEquipe: filtroEquipe || undefined,
          filtroEletricista: filtroEletricista || undefined,
          filtroHorario: filtroHorario || undefined,
        });

        if (result.success && result.data) {
          setTableData(result.data.tableData || []);
          setValoresUnicos(result.data.valoresUnicos);
          // Manter escalas para compatibilidade com modais
          setEscalas(result.data.tableData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar escalas:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarEscalas();
  }, [
    periodo,
    filtroBase,
    filtroTipoEquipe,
    filtroEquipe,
    filtroEletricista,
    filtroHorario,
    refreshTrigger,
  ]);

  // Gerar lista de dias do período
  const dias = useMemo(() => {
    if (!periodo[0] || !periodo[1]) return [];

    const inicio = periodo[0].toDate();
    const fim = periodo[1].toDate();
    const listaDias: Date[] = [];

    const currentDate = new Date(inicio);
    while (currentDate <= fim) {
      listaDias.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return listaDias;
  }, [periodo]);

  // Criar colunas da tabela (sem filtros nas colunas)
  const columns: ColumnsType<any> = useMemo(() => {
    const baseColumns: ColumnsType<any> = [
      {
        title: 'Base',
        dataIndex: 'base',
        key: 'base',
        width: 120,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
          style: getEquipeCellStyle(record),
        }),
      },
      {
        title: 'Prefixo',
        dataIndex: 'prefixo',
        key: 'prefixo',
        width: 100,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
          style: getEquipeCellStyle(record),
        }),
      },
      {
        title: 'Horário',
        dataIndex: 'horario',
        key: 'horario',
        width: 200,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
          style: getEquipeCellStyle(record),
        }),
        render: (horario: string, record: any) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{horario}</span>
            <Button
              type='link'
              size='small'
              icon={<EditOutlined />}
              onClick={async () => {
                setEquipeIdParaHorario(record.equipeId);
                setHorarioVigenteEditando(null);
                setLoadingHorarioVigente(true);
                try {
                  // Buscar horário vigente para esta equipe
                  const result = await buscarHorarioVigente({
                    equipeId: record.equipeId,
                    data: new Date(),
                  });
                  if (result?.success && result.data) {
                    setHorarioVigenteEditando(result.data);
                  } else {
                    setHorarioVigenteEditando(null);
                  }
                } catch (error) {
                  console.error('Erro ao buscar horário vigente:', error);
                  setHorarioVigenteEditando(null);
                } finally {
                  setLoadingHorarioVigente(false);
                  setModalHorarioOpen(true);
                }
              }}
              title={
                record.temHorario
                  ? 'Editar horário da equipe'
                  : 'Definir horário da equipe'
              }
              style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
              loading={loadingHorarioVigente}
            />
          </div>
        ),
      },
      {
        title: 'Eletricista',
        key: 'eletricista',
        width: 250,
        onCell: (record: any) => ({
          style: getEquipeCellStyle(record),
        }),
        render: (_: unknown, record: any) => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{record.eletricista}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {record.matricula}
              </div>
            </div>
            {/* Botão de substituir eletricista */}
            <Button
              type='text'
              size='small'
              icon={<UserSwitchOutlined />}
              onClick={() => {
                setDadosSubstituicao({
                  escalaId: record.escalaId,
                  eletricistaSaiId: record.eletricistaId,
                  eletricistaSaiNome: record.eletricista,
                  periodoInicial: periodo,
                });
                setModalSubstituicaoOpen(true);
              }}
              title='Substituir Eletricista (Férias/Ausência)'
            />
          </div>
        ),
      },
      ...dias.map(dia => {
        const diaKey = dia.toISOString().split('T')[0];
        const diaMes = dia.getDate();
        const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][
          dia.getDay()
        ];
        const estadosDisponiveis = ['TRABALHO', 'FOLGA', 'FALTA', 'EXCECAO'];
        const filtroAtivo = !!filtrosDias[diaKey];

        return {
          title: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {diaMes}
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>{diaSemana}</div>
            </div>
          ),
          dataIndex: diaKey,
          key: diaKey,
          width: 50,
          align: 'center' as const,
          onCell: (record: any) => ({
            style: getEquipeCellStyle(record),
          }),
          render: (estado: string | null, record: any) => {
            if (!estado) {
              return <span style={{ color: '#ccc' }}>-</span>;
            }

            const config = {
              TRABALHO: { color: 'green', label: 'T', title: 'Trabalho' },
              FOLGA: { color: 'red', label: 'F', title: 'Folga' },
              FALTA: { color: 'orange', label: 'X', title: 'Falta' },
              EXCECAO: { color: 'blue', label: 'E', title: 'Exceção' },
            }[estado] || { color: 'default', label: '?', title: estado };

            // Encontrar o slot completo para edição
            const slotFinal = record[`${diaKey}_slot`] as Slot | undefined;

            return (
              <Tag
                color={config.color}
                style={{
                  margin: 0,
                  width: '100%',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title={`${config.title} - Clique para editar`}
                onClick={e => {
                  e.stopPropagation();
                  if (slotFinal) {
                    const slotDate = new Date(slotFinal.data);
                    setSlotEditando({
                      slotId: slotFinal.id,
                      escalaId: record.escalaId,
                      eletricistaId: record.eletricistaId,
                      eletricistaNome: record.eletricista,
                      data: slotDate,
                      estado: slotFinal.estado,
                      anotacoesDia: slotFinal.anotacoesDia || null,
                    });
                    formSlot.setFieldsValue({
                      estado: slotFinal.estado,
                      anotacoesDia: slotFinal.anotacoesDia || '',
                    });
                    setModalSlotOpen(true);
                  } else {
                    console.error('Slot não encontrado:', {
                      record,
                      diaKey,
                      escalas,
                    });
                  }
                }}
              >
                {config.label}
              </Tag>
            );
          },
          filterDropdown: (props: any) => {
            const { setSelectedKeys, confirm, clearFilters } = props;
            return (
              <div style={{ padding: 8 }}>
                <Select
                  style={{ width: '100%', marginBottom: 8, display: 'block' }}
                  placeholder='Filtrar estado'
                  value={filtrosDias[diaKey] || undefined}
                  onChange={value => {
                    setFiltrosDias(prev => ({
                      ...prev,
                      [diaKey]: value || null,
                    }));
                    setSelectedKeys(value ? [value] : []);
                    confirm();
                  }}
                  allowClear
                  size='small'
                >
                  {estadosDisponiveis.map(estado => {
                    const config = {
                      TRABALHO: { color: 'green', label: 'Trabalho' },
                      FOLGA: { color: 'red', label: 'Folga' },
                      FALTA: { color: 'orange', label: 'Falta' },
                      EXCECAO: { color: 'blue', label: 'Exceção' },
                    }[estado] || { color: 'default', label: estado };

                    return (
                      <Select.Option key={estado} value={estado}>
                        <Tag color={config.color} style={{ margin: 0 }}>
                          {config.label}
                        </Tag>
                      </Select.Option>
                    );
                  })}
                </Select>
                <Space>
                  <button
                    onClick={() => {
                      setFiltrosDias(prev => {
                        const novo = { ...prev };
                        delete novo[diaKey];
                        return novo;
                      });
                      clearFilters?.();
                      confirm();
                    }}
                    style={{ width: '100%' }}
                  >
                    Limpar
                  </button>
                </Space>
              </div>
            );
          },
          filterIcon: () => (
            <SearchOutlined
              style={{
                color: filtroAtivo ? '#1890ff' : undefined,
                fontSize: '12px',
              }}
            />
          ),
        };
      }),
    ];

    return baseColumns;
  }, [dias, filtrosDias, escalas, formSlot, loadingHorarioVigente, periodo]);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <div>
            <Title level={2}>
              <CalendarOutlined /> Edição em Curso
            </Title>
            <p style={{ color: '#666', marginTop: '8px' }}>
              Visualize todas as escalas publicadas em formato de grade
            </p>
          </div>

          <Space>
            <RangePicker
              value={periodo}
              onChange={dates => {
                if (dates && dates[0] && dates[1]) {
                  setPeriodo([dates[0], dates[1]]);
                }
              }}
              format='DD/MM/YYYY'
              style={{ width: 300 }}
            />
          </Space>

          {/* Linha de Filtros */}
          <Row gutter={16} align='bottom'>
            <Col xs={24} sm={12} lg={8}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Base
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder='Filtrar por base'
                value={filtroBase}
                onChange={value => setFiltroBase(value)}
                allowClear
              >
                {valoresUnicos.bases.map(base => (
                  <Select.Option key={base} value={base}>
                    {base}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Tipo de Equipe
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder='Filtrar por tipo de equipe'
                value={filtroTipoEquipe}
                onChange={value => setFiltroTipoEquipe(value)}
                allowClear
              >
                {valoresUnicos.tiposEquipe.map(tipo => (
                  <Select.Option key={tipo} value={tipo}>
                    {tipo}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Equipe
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder='Filtrar por equipe'
                value={filtroEquipe}
                onChange={value => setFiltroEquipe(value)}
                allowClear
                showSearch
                optionFilterProp='children'
                filterOption={(input, option) => {
                  const label =
                    typeof option?.children === 'string'
                      ? option.children
                      : String(option?.children ?? '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {valoresUnicos.equipes.map(equipe => (
                  <Select.Option key={equipe} value={equipe}>
                    {equipe}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Horário
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder='Filtrar por horário'
                value={filtroHorario}
                onChange={value => setFiltroHorario(value)}
                allowClear
              >
                {valoresUnicos.horarios.map(horario => (
                  <Select.Option key={horario} value={horario}>
                    {horario}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Eletricista
              </div>
              <Input
                placeholder='Buscar por nome ou matrícula'
                value={filtroEletricista}
                onChange={e => setFiltroEletricista(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>
                Exportar
              </div>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const result = exportarEscalaCSV(
                    tableData,
                    dias,
                    filtrosDias
                  );
                  if (result.ok) {
                    message.success('Exportação concluída. Arquivo CSV baixado.');
                  } else {
                    message.warning(result.error);
                  }
                }}
                disabled={!tableData.length}
                style={{ width: '100%' }}
              >
                Exportar escala (CSV/Excel)
              </Button>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>
                Filtros
              </div>
              <Button
                onClick={() => {
                  setFiltroBase(null);
                  setFiltroTipoEquipe(null);
                  setFiltroEquipe(null);
                  setFiltroEletricista('');
                  setFiltroHorario(null);
                  setFiltrosDias({});
                }}
                style={{ width: '100%' }}
              >
                Limpar Todos os Filtros
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size='large' />
            </div>
          ) : escalas.length === 0 ? (
            <Alert
              message='Nenhuma escala publicada encontrada'
              description='Não há escalas publicadas no período selecionado.'
              type='info'
              showIcon
            />
          ) : (
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size='small'
              bordered
            />
          )}
        </Space>
      </Card>

      {/* Modal de Transferência */}
      <Modal
        title='Transferir Escala'
        open={modalTransferenciaOpen}
        onCancel={() => {
          setModalTransferenciaOpen(false);
          setTransferenciaData(null);
          formTransferencia.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await formTransferencia.validateFields();
            if (!transferenciaData) return;

            setLoadingTransferencia(true);
            const result = await transferirEscala({
              escalaEquipePeriodoId: transferenciaData.escalaId,
              eletricistaOrigemId: transferenciaData.eletricistaOrigemId,
              eletricistaDestinoId: values.eletricistaDestinoId,
              dataInicio: values.dataInicio.toDate(),
            });

            if (result.success) {
              message.success(
                `Escala transferida com sucesso! ${result.data?.slotsTransferidos || 0} slot(s) transferido(s).`
              );
              setModalTransferenciaOpen(false);
              setTransferenciaData(null);
              formTransferencia.resetFields();

              // Recarregar escalas
              const resultEscalas = await getEscalasPublicadasProcessadas({
                periodoInicio: periodo[0].toDate(),
                periodoFim: periodo[1].toDate(),
                filtroBase: filtroBase || undefined,
                filtroTipoEquipe: filtroTipoEquipe || undefined,
                filtroEquipe: filtroEquipe || undefined,
                filtroEletricista: filtroEletricista || undefined,
                filtroHorario: filtroHorario || undefined,
              });
              if (resultEscalas.success && resultEscalas.data) {
                setTableData(resultEscalas.data.tableData || []);
                setValoresUnicos(resultEscalas.data.valoresUnicos);
                setEscalas(resultEscalas.data.tableData || []);
              }
            } else {
              message.error(result.error || 'Erro ao transferir escala');
            }
          } catch (error: any) {
            if (error?.errorFields) {
              // Erro de validação do formulário
              return;
            }
            message.error(error?.message || 'Erro ao transferir escala');
          } finally {
            setLoadingTransferencia(false);
          }
        }}
        confirmLoading={loadingTransferencia}
        okText='Transferir'
        cancelText='Cancelar'
      >
        <Form form={formTransferencia} layout='vertical'>
          <Form.Item label='Eletricista Origem'>
            <Input value={transferenciaData?.eletricistaOrigemNome} disabled />
          </Form.Item>

          <Form.Item
            label='Eletricista Destino'
            name='eletricistaDestinoId'
            rules={[
              { required: true, message: 'Selecione o eletricista destino' },
            ]}
          >
            <Select
              placeholder='Selecione o eletricista que irá assumir a escala'
              showSearch
              filterOption={(input, option) => {
                const label =
                  typeof option?.label === 'string'
                    ? option.label
                    : String(option?.label ?? '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              options={
                eletricistasData?.data
                  ?.filter(
                    (e: any) => e.id !== transferenciaData?.eletricistaOrigemId
                  )
                  .map((e: any) => ({
                    value: e.id,
                    label: `${e.nome} (${e.matricula})`,
                  })) || []
              }
            />
          </Form.Item>

          <Form.Item
            label='Data de Início'
            name='dataInicio'
            rules={[
              { required: true, message: 'Selecione a data de início' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const hoje = dayjs().startOf('day');
                  const dataSelecionada = value.startOf('day');
                  if (
                    dataSelecionada.isBefore(hoje) ||
                    dataSelecionada.isSame(hoje)
                  ) {
                    return Promise.reject('A data deve ser a partir de amanhã');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={current => {
                if (!current) return false;
                // Não pode ser hoje ou antes
                const hoje = dayjs().startOf('day');
                if (current.isBefore(hoje) || current.isSame(hoje)) return true;

                // Deve estar dentro do período da escala
                if (transferenciaData) {
                  const escala = escalas.find(
                    (e: any) => e.id === transferenciaData.escalaId
                  );
                  if (escala) {
                    const periodoInicio = dayjs(escala.periodoInicio);
                    const periodoFim = dayjs(escala.periodoFim);
                    return (
                      current.isBefore(periodoInicio) ||
                      current.isAfter(periodoFim)
                    );
                  }
                }
                return false;
              }}
              format='DD/MM/YYYY'
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para definir/alterar horário da equipe */}
      <Modal
        title={
          horarioVigenteEditando
            ? 'Editar Horário da Equipe'
            : 'Definir Horário da Equipe'
        }
        open={modalHorarioOpen}
        onCancel={() => {
          setModalHorarioOpen(false);
          setEquipeIdParaHorario(null);
          setHorarioVigenteEditando(null);
        }}
        footer={null}
        width={700}
        destroyOnHidden={true}
      >
        {equipeIdParaHorario && (
          <EquipeTurnoHistoricoForm
            key={`horario-form-${equipeIdParaHorario}-${horarioVigenteEditando?.id || 'new'}`}
            initialValues={
              horarioVigenteEditando
                ? {
                    id: horarioVigenteEditando.id,
                    equipeId: horarioVigenteEditando.equipeId,
                    horarioAberturaCatalogoId:
                      horarioVigenteEditando.horarioAberturaCatalogoId,
                    dataInicio: new Date(horarioVigenteEditando.dataInicio),
                    dataFim: horarioVigenteEditando.dataFim
                      ? new Date(horarioVigenteEditando.dataFim)
                      : null,
                    inicioTurnoHora: horarioVigenteEditando.inicioTurnoHora,
                    duracaoHoras: horarioVigenteEditando.duracaoHoras,
                    duracaoIntervaloHoras:
                      horarioVigenteEditando.duracaoIntervaloHoras,
                    motivo: horarioVigenteEditando.motivo,
                    observacoes: horarioVigenteEditando.observacoes,
                  }
                : {
                    equipeId: equipeIdParaHorario,
                    dataInicio: new Date(),
                    dataFim: null,
                  }
            }
            disableEquipeSelect={true}
            onSubmit={async (values: unknown) => {
              const isEditing = !!horarioVigenteEditando;
              await crudHorario.exec(
                () =>
                  isEditing
                    ? updateEquipeTurnoHistorico({
                        ...(values as any),
                        id: horarioVigenteEditando.id,
                      })
                    : createEquipeTurnoHistorico(values),
                isEditing
                  ? 'Horário atualizado com sucesso!'
                  : 'Horário definido com sucesso!',
                () => {
                  setModalHorarioOpen(false);
                  setEquipeIdParaHorario(null);
                  setHorarioVigenteEditando(null);
                  // Recarregar escalas para atualizar os horários
                  const carregarEscalas = async () => {
                    if (!periodo[0] || !periodo[1]) return;
                    setLoading(true);
                    try {
                      const result = await getEscalasPublicadasProcessadas({
                        periodoInicio: periodo[0].toDate(),
                        periodoFim: periodo[1].toDate(),
                        filtroBase: filtroBase || undefined,
                        filtroTipoEquipe: filtroTipoEquipe || undefined,
                        filtroEquipe: filtroEquipe || undefined,
                        filtroEletricista: filtroEletricista || undefined,
                        filtroHorario: filtroHorario || undefined,
                      });
                      if (result.success && result.data) {
                        setTableData(result.data.tableData || []);
                        setValoresUnicos(result.data.valoresUnicos);
                        setEscalas(result.data.tableData || []);
                      }
                    } catch (error) {
                      console.error('Erro ao carregar escalas:', error);
                    } finally {
                      setLoading(false);
                    }
                  };
                  carregarEscalas();
                }
              );
            }}
            onCancel={() => {
              setModalHorarioOpen(false);
              setEquipeIdParaHorario(null);
              setHorarioVigenteEditando(null);
            }}
          />
        )}
      </Modal>

      {/* Modal de Edição de Slot */}
      <Modal
        title='Editar Slot'
        open={modalSlotOpen}
        onCancel={() => {
          setModalSlotOpen(false);
          setSlotEditando(null);
          formSlot.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await formSlot.validateFields();
            if (!slotEditando) return;

            setLoadingSlot(true);
            const result = await updateSlotEscala({
              id: slotEditando.slotId,
              escalaEquipePeriodoId: slotEditando.escalaId,
              data: slotEditando.data,
              estado: values.estado,
              anotacoesDia: values.anotacoesDia || undefined,
            });

            if (result.success) {
              message.success('Slot atualizado com sucesso!');
              setModalSlotOpen(false);
              setSlotEditando(null);
              formSlot.resetFields();

              // Recarregar escalas

              const resultEscalas = await getEscalasPublicadasProcessadas({
                periodoInicio: periodo[0].toDate(),
                periodoFim: periodo[1].toDate(),
                filtroBase: filtroBase || undefined,
                filtroTipoEquipe: filtroTipoEquipe || undefined,
                filtroEquipe: filtroEquipe || undefined,
                filtroEletricista: filtroEletricista || undefined,
                filtroHorario: filtroHorario || undefined,
              });
              if (resultEscalas.success && resultEscalas.data) {
                setTableData(resultEscalas.data.tableData || []);
                setValoresUnicos(resultEscalas.data.valoresUnicos);
                setEscalas(resultEscalas.data.tableData || []);
              }
            } else {
              message.error(result.error || 'Erro ao atualizar slot');
            }
          } catch (error: any) {
            if (error?.errorFields) {
              // Erro de validação do formulário
              return;
            }
            message.error(error?.message || 'Erro ao atualizar slot');
          } finally {
            setLoadingSlot(false);
          }
        }}
        confirmLoading={loadingSlot}
        okText='Salvar'
        cancelText='Cancelar'
        width={600}
      >
        {slotEditando && (
          <Form form={formSlot} layout='vertical'>
            <Form.Item label='Eletricista'>
              <Input value={slotEditando.eletricistaNome} disabled />
            </Form.Item>

            <Form.Item label='Data'>
              <Input
                value={dayjs(slotEditando.data).format('DD/MM/YYYY')}
                disabled
              />
            </Form.Item>

            <Form.Item
              label='Estado'
              name='estado'
              rules={[{ required: true, message: 'Selecione o estado' }]}
            >
              <Select>
                <Select.Option value='TRABALHO'>
                  <Tag color='green'>Trabalho</Tag>
                </Select.Option>
                <Select.Option value='FOLGA'>
                  <Tag color='red'>Folga</Tag>
                </Select.Option>
                <Select.Option value='FALTA'>
                  <Tag color='orange'>Falta</Tag>
                </Select.Option>
                <Select.Option value='EXCECAO'>
                  <Tag color='blue'>Exceção</Tag>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label='Anotações do Dia'
              name='anotacoesDia'
              rules={[{ max: 1000, message: 'Máximo de 1000 caracteres' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder='Anotações sobre este dia (opcional)'
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      <SubstituirEletricistaModal
        visible={modalSubstituicaoOpen}
        onClose={() => setModalSubstituicaoOpen(false)}
        dados={dadosSubstituicao}
        eletricistas={eletricistasData}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
