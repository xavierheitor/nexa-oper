/**
 * Visualização Geral de Escalas
 *
 * Componente para visualizar múltiplas escalas de equipes de forma agrupada,
 * facilitando a visão geral da operação.
 *
 * FUNCIONALIDADES:
 * - Filtro por período
 * - Agrupamento por base (lotação)
 * - Visualização de horário definido
 * - Cards por equipe mostrando status e detalhes
 * - Estatísticas por grupo
 */

'use client';

import { useState } from 'react';
import {
  Modal,
  DatePicker,
  Button,
  Card,
  Space,
  Tag,
  Collapse,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  Alert,
  Typography,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getVisualizacaoGeral } from '@/lib/actions/escala/visualizacaoGeral';

const { RangePicker } = DatePicker;

interface VisualizacaoGeralProps {
  open: boolean;
  onClose: () => void;
  onVisualizarEscala?: (escalaId: number) => void;
}

interface Slot {
  id: number;
  data: Date;
  estado: string;
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
}

interface EscalaComEquipe {
  id: number;
  equipe: {
    id: number;
    nome: string;
  };
  equipeBaseAtual?: {
    nome: string;
  } | null;
  tipoEscala: {
    nome: string;
  };
  periodoInicio: Date;
  periodoFim: Date;
  status: string;
  versao: number;
  Slots?: Slot[];
  _count?: {
    Slots: number;
  };
  temHorario?: boolean;
  horarioInfo?: {
    id: number;
    inicioTurnoHora: string;
    duracaoHoras: number;
    duracaoIntervaloHoras: number;
    fimTurnoHora: string | null;
    dataInicio: Date;
    dataFim: Date | null;
  } | null;
}

interface EscalasPorBase {
  baseName: string;
  escalas: EscalaComEquipe[];
  totalSlots: number;
  equipes: number;
  eletricistasUnicos: number;
}

export default function VisualizacaoGeral({
  open,
  onClose,
  onVisualizarEscala,
}: VisualizacaoGeralProps) {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [escalas, setEscalas] = useState<EscalaComEquipe[]>([]);
  const [escalasPorBase, setEscalasPorBase] = useState<EscalasPorBase[]>([]);

  const handleBuscar = async () => {
    if (!periodo) return;

    setLoading(true);
    try {
      const [inicio, fim] = periodo;

      const result = await getVisualizacaoGeral({
        periodoInicio: inicio.toDate(),
        periodoFim: fim.toDate(),
      });

      if (result.success && result.data) {
        const escalasData = result.data as any[];
        setEscalas(escalasData);

        // Agrupa por base
        agruparPorBase(escalasData);
      }
    } catch (error) {
      console.error('Erro ao buscar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  const agruparPorBase = (escalasData: EscalaComEquipe[]) => {
    const grupos: Map<string, EscalaComEquipe[]> = new Map();

    escalasData.forEach((escala) => {
      const baseName = escala.equipeBaseAtual?.nome || 'Sem Lotação';

      if (!grupos.has(baseName)) {
        grupos.set(baseName, []);
      }

      grupos.get(baseName)?.push(escala);
    });

    // Converte Map para array de objetos
    const resultado: EscalasPorBase[] = Array.from(grupos.entries()).map(
      ([baseName, escalas]) => {
        // Conta eletricistas únicos desta base
        const eletricistasIds = new Set<number>();
        escalas.forEach((escala) => {
          escala.Slots?.forEach((slot) => {
            eletricistasIds.add(slot.eletricista.id);
          });
        });

        return {
          baseName,
          escalas,
          totalSlots: escalas.reduce((sum, e) => sum + (e.Slots?.length || 0), 0),
          equipes: escalas.length,
          eletricistasUnicos: eletricistasIds.size,
        };
      }
    );

    // Ordena por nome da base
    resultado.sort((a, b) => {
      if (a.baseName === 'Sem Lotação') return 1;
      if (b.baseName === 'Sem Lotação') return -1;
      return a.baseName.localeCompare(b.baseName);
    });

    setEscalasPorBase(resultado);
  };

  const handleClose = () => {
    setPeriodo(null);
    setEscalas([]);
    setEscalasPorBase([]);
    onClose();
  };

  const statusColors: Record<string, string> = {
    RASCUNHO: 'default',
    EM_APROVACAO: 'warning',
    PUBLICADA: 'success',
    ARQUIVADA: 'error',
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Visualização Geral de Escalas</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={1200}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {/* Filtro de Período */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['Data Início', 'Data Fim']}
              value={periodo}
              onChange={(dates) => setPeriodo(dates as any)}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              onClick={handleBuscar}
              loading={loading}
              disabled={!periodo}
              icon={<CalendarOutlined />}
            >
              Buscar Escalas
            </Button>
          </Space>

          {escalas.length > 0 && (
            <Alert
              message={`${escalas.length} escala(s) encontrada(s) no período selecionado`}
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      )}

      {/* Sem dados */}
      {!loading && escalas.length === 0 && periodo && (
        <Empty description="Nenhuma escala encontrada no período selecionado" />
      )}

      {/* Agrupamento por Base */}
      {!loading && escalasPorBase.length > 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {escalasPorBase.map((grupo) => (
            <Card
              key={grupo.baseName}
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {grupo.baseName}
                  </span>
                </Space>
              }
              extra={
                <Space size="large">
                  <Statistic
                    title="Equipes"
                    value={grupo.equipes}
                    prefix={<TeamOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                  <Statistic
                    title="Eletricistas"
                    value={grupo.eletricistasUnicos}
                    prefix={<TeamOutlined />}
                    valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                  />
                  <Statistic
                    title="Slots (Período)"
                    value={grupo.totalSlots}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Space>
              }
              size="small"
              style={{ background: '#fafafa' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {grupo.escalas.map((escala) => (
                  <Card
                    key={escala.id}
                    size="small"
                    style={{ background: 'white' }}
                    extra={
                      onVisualizarEscala && (
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => onVisualizarEscala(escala.id)}
                        >
                          Detalhes
                        </Button>
                      )
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Space direction="vertical" size="small">
                          <div>
                            <TeamOutlined style={{ marginRight: 8 }} />
                            <strong>{escala.equipe.nome}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Tipo: {escala.tipoEscala.nome}
                          </div>
                        </Space>
                      </Col>

                      <Col span={6}>
                        <Space direction="vertical" size="small">
                          <div style={{ fontSize: '12px', color: '#666' }}>Período:</div>
                          <div style={{ fontSize: '13px' }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {dayjs(escala.periodoInicio).format('DD/MM/YYYY')} até{' '}
                            {dayjs(escala.periodoFim).format('DD/MM/YYYY')}
                          </div>
                        </Space>
                      </Col>

                      <Col span={4}>
                        <Space direction="vertical" size="small">
                          <div style={{ fontSize: '12px', color: '#666' }}>Status:</div>
                          <Tag color={statusColors[escala.status] || 'default'}>
                            {escala.status}
                          </Tag>
                        </Space>
                      </Col>

                      <Col span={3}>
                        <Space direction="vertical" size="small">
                          <div style={{ fontSize: '12px', color: '#666' }}>Slots:</div>
                          <div>
                            <strong style={{ fontSize: '16px', color: '#1890ff' }}>
                              {escala._count?.Slots || 0}
                            </strong>
                          </div>
                        </Space>
                      </Col>

                      <Col span={3}>
                        <Space direction="vertical" size="small">
                          <div style={{ fontSize: '12px', color: '#666' }}>Horário:</div>
                          <div>
                            {escala.temHorario && escala.horarioInfo ? (
                              <Tooltip
                                title={`${escala.horarioInfo.inicioTurnoHora.substring(0, 5)} (${escala.horarioInfo.duracaoHoras}h + ${escala.horarioInfo.duracaoIntervaloHoras}h int.)`}
                              >
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                  {escala.horarioInfo.inicioTurnoHora.substring(0, 5)}
                                </Tag>
                              </Tooltip>
                            ) : (
                              <Tag color="default">-</Tag>
                            )}
                          </div>
                        </Space>
                      </Col>
                    </Row>

                    {/* Seção de Slots e Eletricistas */}
                    {escala.Slots && escala.Slots.length > 0 ? (
                      <Collapse
                        size="small"
                        style={{ marginTop: 12 }}
                        items={[
                          {
                            key: 'slots',
                            label: (
                              <Space>
                                <TeamOutlined />
                                <span>
                                  Eletricistas Escalados ({escala.Slots.length} slots no período)
                                </span>
                              </Space>
                            ),
                            children: (
                              <div>
                                {/* Lista de eletricistas únicos */}
                                <div style={{ marginBottom: 8 }}>
                                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                    Eletricistas únicos nesta escala:
                                  </Typography.Text>
                                </div>
                                <Space wrap>
                                  {Array.from(
                                    new Set(
                                      escala.Slots.map((slot) => slot.eletricista.id)
                                    )
                                  ).map((eletricistaId) => {
                                    const eletricista = escala.Slots!.find(
                                      (s) => s.eletricista.id === eletricistaId
                                    )?.eletricista;
                                    const slotsDoEletricista = escala.Slots!.filter(
                                      (s) => s.eletricista.id === eletricistaId
                                    );
                                    const trabalho = slotsDoEletricista.filter(
                                      (s) => s.estado === 'TRABALHO'
                                    ).length;
                                    const folga = slotsDoEletricista.filter(
                                      (s) => s.estado === 'FOLGA'
                                    ).length;

                                    return (
                                      <Tag
                                        key={eletricistaId}
                                        color="blue"
                                        style={{ marginBottom: 4 }}
                                      >
                                        {eletricista?.nome} (Mat: {eletricista?.matricula})
                                        <br />
                                        <span style={{ fontSize: '11px' }}>
                                          🟢 {trabalho} trabalho | 🔵 {folga} folga
                                        </span>
                                      </Tag>
                                    );
                                  })}
                                </Space>
                              </div>
                            ),
                          },
                        ]}
                      />
                    ) : (
                      <Alert
                        message="Nenhum slot gerado ainda"
                        description="Clique em 'Detalhes' para gerar os slots desta escala"
                        type="warning"
                        showIcon
                        style={{ marginTop: 12 }}
                        banner
                      />
                    )}
                  </Card>
                ))}
              </Space>
            </Card>
          ))}
        </Space>
      )}

      {/* Estatísticas Gerais */}
      {!loading && escalas.length > 0 && (
        <Card
          size="small"
          style={{ marginTop: 16, background: '#e6f7ff' }}
          title="📊 Resumo Geral do Período"
        >
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="Bases"
                value={escalasPorBase.length}
                prefix={<EnvironmentOutlined />}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Equipes"
                value={escalas.length}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Eletricistas Únicos"
                value={(() => {
                  const eletricistasIds = new Set<number>();
                  escalas.forEach((e) => {
                    e.Slots?.forEach((slot) => {
                      eletricistasIds.add(slot.eletricista.id);
                    });
                  });
                  return eletricistasIds.size;
                })()}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Total de Slots"
                value={escalas.reduce((sum, e) => sum + (e.Slots?.length || 0), 0)}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Publicadas"
                value={escalas.filter(e => e.status === 'PUBLICADA').length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}
    </Modal>
  );
}
