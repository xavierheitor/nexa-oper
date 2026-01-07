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
import { CalendarOutlined, SearchOutlined, SwapOutlined, EditOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getEscalasPublicadas } from '@/lib/actions/escala/edicaoEmCurso';
import { transferirEscala, updateSlotEscala } from '@/lib/actions/escala/escalaEquipePeriodo';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import { createEquipeTurnoHistorico, updateEquipeTurnoHistorico, buscarHorarioVigente } from '@/lib/actions/escala/equipeTurnoHistorico';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useCrudController } from '@/lib/hooks/useCrudController';
import EquipeTurnoHistoricoForm from '@/app/dashboard/cadastro/equipe-horario/form';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Title } = Typography;

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

  // Estados dos filtros
  const [filtroBase, setFiltroBase] = useState<string | null>(null);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<string | null>(null);
  const [filtroEquipe, setFiltroEquipe] = useState<string | null>(null);
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroHorario, setFiltroHorario] = useState<string | null>(null);
  const [filtrosDias, setFiltrosDias] = useState<Record<string, string | null>>({});

  // Estados para transferência
  const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);
  const [transferenciaData, setTransferenciaData] = useState<{
    escalaId: number;
    eletricistaOrigemId: number;
    eletricistaOrigemNome: string;
  } | null>(null);
  const [formTransferencia] = Form.useForm();
  const [loadingTransferencia, setLoadingTransferencia] = useState(false);

  // Estados para modal de horário
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [equipeIdParaHorario, setEquipeIdParaHorario] = useState<number | null>(null);
  const [horarioVigenteEditando, setHorarioVigenteEditando] = useState<any | null>(null);
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

  // Buscar eletricistas para o select
  const { data: eletricistasData } = useDataFetch(
    () => listEletricistas({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  // Carregar escalas quando o período muda
  React.useEffect(() => {
    const carregarEscalas = async () => {
      if (!periodo[0] || !periodo[1]) return;

      setLoading(true);
      // Limpar filtros quando o período muda
      setFiltroBase(null);
      setFiltroTipoEquipe(null);
      setFiltroEquipe(null);
      setFiltroEletricista('');
      setFiltroHorario(null);
      setFiltrosDias({});

      try {
        const result = await getEscalasPublicadas({
          periodoInicio: periodo[0].toDate(),
          periodoFim: periodo[1].toDate(),
        });

        if (result.success && result.data) {
          setEscalas(result.data as any);
        }
      } catch (error) {
        console.error('Erro ao carregar escalas:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarEscalas();
  }, [periodo]);

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

  // Extrair valores únicos para os filtros
  const valoresUnicos = useMemo(() => {
    const bases = new Set<string>();
    const tiposEquipe = new Set<string>();
    const equipes = new Set<string>();
    const horarios = new Set<string>();

    escalas.forEach((escala: any) => {
      if (escala.base?.nome) {
        bases.add(escala.base.nome);
      }
      if (escala.equipe?.tipoEquipe?.nome) {
        tiposEquipe.add(escala.equipe.tipoEquipe.nome);
      }
      if (escala.equipe?.nome) {
        equipes.add(escala.equipe.nome);
      }
      if (escala.horario) {
        const horarioStr = `${escala.horario.inicioTurnoHora.substring(0, 5)}${escala.horario.fimTurnoHora ? ` - ${escala.horario.fimTurnoHora.substring(0, 5)}` : ''}`;
        horarios.add(horarioStr);
      } else {
        horarios.add('Sem horário definido');
      }
    });

    return {
      bases: Array.from(bases).sort(),
      tiposEquipe: Array.from(tiposEquipe).sort(),
      equipes: Array.from(equipes).sort(),
      horarios: Array.from(horarios).sort(),
    };
  }, [escalas]);

  // Preparar dados para a tabela
  const tableData = useMemo(() => {
    const dados: any[] = [];

    escalas.forEach((escala: any) => {
      // Agrupar slots por eletricista
      const slotsPorEletricista = new Map<number, Slot[]>();
      escala.Slots.forEach((slot: Slot) => {
        if (!slotsPorEletricista.has(slot.eletricistaId)) {
          slotsPorEletricista.set(slot.eletricistaId, []);
        }
        slotsPorEletricista.get(slot.eletricistaId)!.push(slot);
      });

      // Obter lista de eletricistas únicos desta escala
      const eletricistasIds = Array.from(slotsPorEletricista.keys());
      const totalEletricistas = eletricistasIds.length;

      // Criar uma linha para cada eletricista
      eletricistasIds.forEach((eletricistaId, index) => {
        const slots = slotsPorEletricista.get(eletricistaId)!;
        const primeiroSlot = slots[0];
        const eletricista = primeiroSlot.eletricista;

        const horarioStr = escala.horario
          ? `${escala.horario.inicioTurnoHora.substring(0, 5)}${escala.horario.fimTurnoHora ? ` - ${escala.horario.fimTurnoHora.substring(0, 5)}` : ''}`
          : 'Sem horário definido';

        const row: any = {
          key: `${escala.id}-${eletricistaId}`,
          escalaId: escala.id,
          equipeId: escala.equipe.id,
          eletricistaId,
          equipeNome: escala.equipe?.nome || '-',
          tipoEquipe: escala.equipe?.tipoEquipe?.nome || '-',
          base: escala.base?.nome || '-',
          prefixo: escala.equipe.nome.substring(0, 10) || '-', // Usa parte do nome como prefixo
          horario: horarioStr,
          temHorario: !!escala.horario,
          eletricista: eletricista.nome,
          matricula: eletricista.matricula,
          // Primeira linha da escala terá rowSpan igual ao número de eletricistas
          isFirstRow: index === 0,
          rowSpan: index === 0 ? totalEletricistas : 0,
        };

        // Adicionar slots para cada dia
        dias.forEach((dia) => {
          const diaKey = dia.toISOString().split('T')[0];
          const slot = slots.find((s: Slot) => {
            const slotDate = new Date(s.data);
            return slotDate.toISOString().split('T')[0] === diaKey;
          });
          row[diaKey] = slot ? slot.estado : null;
          // Armazenar o slot completo para acesso posterior na edição
          if (slot) {
            row[`${diaKey}_slot`] = slot;
          }
        });

        dados.push(row);
      });
    });

    // Aplicar filtros
    return dados.filter((row) => {
      // Filtro de base
      if (filtroBase && row.base !== filtroBase) {
        return false;
      }

      // Filtro de tipo de equipe
      if (filtroTipoEquipe && row.tipoEquipe !== filtroTipoEquipe) {
        return false;
      }

      // Filtro de equipe
      if (filtroEquipe && row.equipeNome !== filtroEquipe) {
        return false;
      }

      // Filtro de eletricista (texto)
      if (filtroEletricista) {
        const busca = filtroEletricista.toLowerCase();
        const nomeMatch = row.eletricista?.toLowerCase().includes(busca);
        const matriculaMatch = row.matricula?.toLowerCase().includes(busca);
        if (!nomeMatch && !matriculaMatch) {
          return false;
        }
      }

      // Filtro de horário
      if (filtroHorario && row.horario !== filtroHorario) {
        return false;
      }

      // Filtros de dias
      for (const [diaKey, filtroEstado] of Object.entries(filtrosDias)) {
        if (filtroEstado && row[diaKey] !== filtroEstado) {
          return false;
        }
      }

      return true;
    });
  }, [
    escalas,
    dias,
    filtroBase,
    filtroTipoEquipe,
    filtroEquipe,
    filtroEletricista,
    filtroHorario,
    filtrosDias,
  ]);

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
        }),
      },
      {
        title: 'Prefixo',
        dataIndex: 'prefixo',
        key: 'prefixo',
        width: 100,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
        }),
      },
      {
        title: 'Horário',
        dataIndex: 'horario',
        key: 'horario',
        width: 200,
        onCell: (record: any) => ({
          rowSpan: record.rowSpan,
        }),
        render: (horario: string, record: any) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{horario}</span>
            <Button
              type="link"
              size="small"
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
              title={record.temHorario ? "Editar horário da equipe" : "Definir horário da equipe"}
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
        render: (_: unknown, record: any) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{record.eletricista}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>{record.matricula}</div>
            </div>
            {/* Botão de transferir comentado - não será usado por enquanto */}
            {/* <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                setTransferenciaData({
                  escalaId: record.escalaId,
                  eletricistaOrigemId: record.eletricistaId,
                  eletricistaOrigemNome: record.eletricista,
                });
                formTransferencia.resetFields();
                setModalTransferenciaOpen(true);
              }}
              title="Transferir escala"
            >
              Transferir
            </Button> */}
          </div>
        ),
      },
      ...dias.map((dia) => {
        const diaKey = dia.toISOString().split('T')[0];
        const diaMes = dia.getDate();
        const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dia.getDay()];
        const estadosDisponiveis = ['TRABALHO', 'FOLGA', 'FALTA', 'EXCECAO'];
        const filtroAtivo = !!filtrosDias[diaKey];

        return {
          title: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{diaMes}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>{diaSemana}</div>
            </div>
          ),
          dataIndex: diaKey,
          key: diaKey,
          width: 50,
          align: 'center' as const,
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
            const slotCompleto = record[`${diaKey}_slot`] as Slot | undefined;

            // Se não encontrou no record, buscar nas escalas
            const slotFinal = slotCompleto || escalas
              .find((e: any) => e.id === record.escalaId)
              ?.Slots?.find((s: Slot) => {
                const slotDate = new Date(s.data);
                const slotDateKey = slotDate.toISOString().split('T')[0];
                return (
                  slotDateKey === diaKey &&
                  s.eletricistaId === record.eletricistaId
                );
              });

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
                onClick={(e) => {
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
                    console.error('Slot não encontrado:', { record, diaKey, escalas });
                  }
                }}
              >
                {config.label}
              </Tag>
            );
          },
          filterDropdown: (props: any) => {
            const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
            return (
              <div style={{ padding: 8 }}>
                <Select
                  style={{ width: '100%', marginBottom: 8, display: 'block' }}
                  placeholder="Filtrar estado"
                  value={filtrosDias[diaKey] || undefined}
                  onChange={(value) => {
                    setFiltrosDias((prev) => ({
                      ...prev,
                      [diaKey]: value || null,
                    }));
                    setSelectedKeys(value ? [value] : []);
                    confirm();
                  }}
                  allowClear
                  size="small"
                >
                  {estadosDisponiveis.map((estado) => {
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
                      setFiltrosDias((prev) => {
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
            <SearchOutlined style={{ color: filtroAtivo ? '#1890ff' : undefined, fontSize: '12px' }} />
          ),
        };
      }),
    ];

    return baseColumns;
  }, [dias, filtrosDias]);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
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
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setPeriodo([dates[0], dates[1]]);
                }
              }}
              format="DD/MM/YYYY"
              style={{ width: 300 }}
            />
          </Space>

          {/* Linha de Filtros */}
          <Row gutter={16} align="bottom">
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>Base</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por base"
                value={filtroBase}
                onChange={(value) => setFiltroBase(value)}
                allowClear
              >
                {valoresUnicos.bases.map((base) => (
                  <Select.Option key={base} value={base}>
                    {base}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>Tipo de Equipe</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por tipo de equipe"
                value={filtroTipoEquipe}
                onChange={(value) => setFiltroTipoEquipe(value)}
                allowClear
              >
                {valoresUnicos.tiposEquipe.map((tipo) => (
                  <Select.Option key={tipo} value={tipo}>
                    {tipo}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>Equipe</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por equipe"
                value={filtroEquipe}
                onChange={(value) => setFiltroEquipe(value)}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = typeof option?.children === 'string'
                    ? option.children
                    : String(option?.children ?? '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {valoresUnicos.equipes.map((equipe) => (
                  <Select.Option key={equipe} value={equipe}>
                    {equipe}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>Horário</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por horário"
                value={filtroHorario}
                onChange={(value) => setFiltroHorario(value)}
                allowClear
              >
                {valoresUnicos.horarios.map((horario) => (
                  <Select.Option key={horario} value={horario}>
                    {horario}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>Eletricista</div>
              <Input
                placeholder="Buscar por nome ou matrícula"
                value={filtroEletricista}
                onChange={(e) => setFiltroEletricista(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
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
              <Spin size="large" />
            </div>
          ) : escalas.length === 0 ? (
            <Alert
              message="Nenhuma escala publicada encontrada"
              description="Não há escalas publicadas no período selecionado."
              type="info"
              showIcon
            />
          ) : (
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
              bordered
            />
          )}
        </Space>
      </Card>

      {/* Modal de Transferência */}
      <Modal
        title="Transferir Escala"
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
              const resultEscalas = await getEscalasPublicadas({
                periodoInicio: periodo[0].toDate(),
                periodoFim: periodo[1].toDate(),
              });
              if (resultEscalas.success && resultEscalas.data) {
                setEscalas(resultEscalas.data as any);
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
        okText="Transferir"
        cancelText="Cancelar"
      >
        <Form form={formTransferencia} layout="vertical">
          <Form.Item label="Eletricista Origem">
            <Input
              value={transferenciaData?.eletricistaOrigemNome}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Eletricista Destino"
            name="eletricistaDestinoId"
            rules={[{ required: true, message: 'Selecione o eletricista destino' }]}
          >
            <Select
              placeholder="Selecione o eletricista que irá assumir a escala"
              showSearch
              filterOption={(input, option) => {
                const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              options={
                eletricistasData?.data
                  ?.filter((e: any) => e.id !== transferenciaData?.eletricistaOrigemId)
                  .map((e: any) => ({
                    value: e.id,
                    label: `${e.nome} (${e.matricula})`,
                  })) || []
              }
            />
          </Form.Item>

          <Form.Item
            label="Data de Início"
            name="dataInicio"
            rules={[
              { required: true, message: 'Selecione a data de início' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const hoje = dayjs().startOf('day');
                  const dataSelecionada = value.startOf('day');
                  if (dataSelecionada.isBefore(hoje) || dataSelecionada.isSame(hoje)) {
                    return Promise.reject('A data deve ser a partir de amanhã');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => {
                if (!current) return false;
                // Não pode ser hoje ou antes
                const hoje = dayjs().startOf('day');
                if (current.isBefore(hoje) || current.isSame(hoje)) return true;

                // Deve estar dentro do período da escala
                if (transferenciaData) {
                  const escala = escalas.find((e: any) => e.id === transferenciaData.escalaId);
                  if (escala) {
                    const periodoInicio = dayjs(escala.periodoInicio);
                    const periodoFim = dayjs(escala.periodoFim);
                    return current.isBefore(periodoInicio) || current.isAfter(periodoFim);
                  }
                }
                return false;
              }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para definir/alterar horário da equipe */}
      <Modal
        title={horarioVigenteEditando ? "Editar Horário da Equipe" : "Definir Horário da Equipe"}
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
                    horarioAberturaCatalogoId: horarioVigenteEditando.horarioAberturaCatalogoId,
                    dataInicio: new Date(horarioVigenteEditando.dataInicio),
                    dataFim: horarioVigenteEditando.dataFim ? new Date(horarioVigenteEditando.dataFim) : null,
                    inicioTurnoHora: horarioVigenteEditando.inicioTurnoHora,
                    duracaoHoras: horarioVigenteEditando.duracaoHoras,
                    duracaoIntervaloHoras: horarioVigenteEditando.duracaoIntervaloHoras,
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
                    ? updateEquipeTurnoHistorico({ ...(values as any), id: horarioVigenteEditando.id })
                    : createEquipeTurnoHistorico(values),
                isEditing ? 'Horário atualizado com sucesso!' : 'Horário definido com sucesso!',
                () => {
                  setModalHorarioOpen(false);
                  setEquipeIdParaHorario(null);
                  setHorarioVigenteEditando(null);
                  // Recarregar escalas para atualizar os horários
                  const carregarEscalas = async () => {
                    if (!periodo[0] || !periodo[1]) return;
                    setLoading(true);
                    try {
                      const result = await getEscalasPublicadas({
                        periodoInicio: periodo[0].toDate(),
                        periodoFim: periodo[1].toDate(),
                      });
                      if (result.success && result.data) {
                        setEscalas(result.data as any);
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
        title="Editar Slot"
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
              const resultEscalas = await getEscalasPublicadas({
                periodoInicio: periodo[0].toDate(),
                periodoFim: periodo[1].toDate(),
              });
              if (resultEscalas.success && resultEscalas.data) {
                setEscalas(resultEscalas.data as any);
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
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        {slotEditando && (
          <Form form={formSlot} layout="vertical">
            <Form.Item label="Eletricista">
              <Input value={slotEditando.eletricistaNome} disabled />
            </Form.Item>

            <Form.Item label="Data">
              <Input
                value={dayjs(slotEditando.data).format('DD/MM/YYYY')}
                disabled
              />
            </Form.Item>

            <Form.Item
              label="Estado"
              name="estado"
              rules={[{ required: true, message: 'Selecione o estado' }]}
            >
              <Select>
                <Select.Option value="TRABALHO">
                  <Tag color="green">Trabalho</Tag>
                </Select.Option>
                <Select.Option value="FOLGA">
                  <Tag color="red">Folga</Tag>
                </Select.Option>
                <Select.Option value="FALTA">
                  <Tag color="orange">Falta</Tag>
                </Select.Option>
                <Select.Option value="EXCECAO">
                  <Tag color="blue">Exceção</Tag>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Anotações do Dia"
              name="anotacoesDia"
              rules={[
                { max: 1000, message: 'Máximo de 1000 caracteres' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Anotações sobre este dia (opcional)"
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
