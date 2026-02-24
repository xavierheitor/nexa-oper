/**
 * Modal para visualizar histórico de localização de um turno
 *
 * Exibe um mapa com todas as localizações registradas durante o turno,
 * conectadas por uma linha e numeradas em ordem cronológica.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal, Spin, Empty, Typography, Space, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { getLocalizacoesTurno } from '@/lib/actions/turno/getLocalizacoes';
import dynamic from 'next/dynamic';

// Importar o mapa completo dinamicamente para evitar problemas de SSR
const LeafletMap = dynamic(
  () => import('./LeafletMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Carregando mapa...</Text>
      </div>
    )
  }
);

const { Title, Text } = Typography;

interface Localizacao {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: Date;
  tagType: string | null;
  tagDetail: string | null;
  batteryLevel: number | null;
}

interface TurnoLocationMapModalProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  turnoInfo?: {
    id: number;
    veiculo?: { placa?: string };
    equipe?: { nome?: string };
  };
}

export default function TurnoLocationMapModal({
  visible,
  onClose,
  turnoId,
  turnoInfo,
}: TurnoLocationMapModalProps) {
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocalizacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Log para debug
      console.log('[TurnoLocationMapModal] Buscando localizações para turnoId:', turnoId);
      console.log('[TurnoLocationMapModal] Tipo do turnoId:', typeof turnoId);

      // ✅ Garantir que turnoId seja número
      const turnoIdNumero = Number(turnoId);
      console.log('[TurnoLocationMapModal] turnoId convertido para número:', turnoIdNumero);

      if (!turnoIdNumero || turnoIdNumero <= 0) {
        setError('ID do turno inválido');
        setLoading(false);
        return;
      }

      const result = await getLocalizacoesTurno({ turnoId: turnoIdNumero });

      // ✅ Log do resultado
      console.log('[TurnoLocationMapModal] Resultado da busca:', result);

      if (result.success && result.data) {
        // Converter capturedAt de string para Date se necessário
        const localizacoesFormatadas = result.data.localizacoes.map((loc: any) => ({
          ...loc,
          capturedAt: new Date(loc.capturedAt),
        }));
        console.log('[TurnoLocationMapModal] Localizações formatadas:', localizacoesFormatadas.length);
        setLocalizacoes(localizacoesFormatadas);
      } else {
        const errorMsg = result.error || 'Erro ao carregar localizações';
        console.error('[TurnoLocationMapModal] Erro:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[TurnoLocationMapModal] Erro ao carregar localizações:', err);
      setError('Erro ao carregar localizações');
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  // Buscar localizações quando o modal abrir
  useEffect(() => {
    if (visible && turnoId) {
      loadLocalizacoes();
    }
  }, [visible, turnoId, loadLocalizacoes]);


  // Gerar link para abrir no Google Maps em nova aba
  const generateGoogleMapsLink = () => {
    if (localizacoes.length === 0) return null;

    if (localizacoes.length === 1) {
      const loc = localizacoes[0];
      return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    }

    // Para múltiplas localizações, cria uma rota
    const waypoints = localizacoes
      .slice(1, -1)
      .map((loc) => `${loc.latitude},${loc.longitude}`)
      .join('/');

    const origin = `${localizacoes[0].latitude},${localizacoes[0].longitude}`;
    const destination = `${localizacoes[localizacoes.length - 1].latitude},${localizacoes[localizacoes.length - 1].longitude}`;

    if (waypoints) {
      return `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;
    } else {
      return `https://www.google.com/maps/dir/${origin}/${destination}`;
    }
  };

  // Formatar data/hora
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Obter cor do nível de bateria
  const getBatteryColor = (level: number | null): string => {
    if (level === null) return 'default';
    if (level >= 50) return 'green';
    if (level >= 20) return 'orange';
    return 'red';
  };

  // Calcular intervalo em minutos entre duas datas
  const getIntervalMinutes = (date1: Date, date2: Date): number => {
    return (date2.getTime() - date1.getTime()) / (1000 * 60);
  };

  // Formatar intervalo em texto legível
  const formatInterval = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Processar localizações e inserir indicadores de gap
  const processLocalizacoesWithGaps = () => {
    const items: Array<{ type: 'location' | 'gap'; data: any; index?: number }> = [];

    localizacoes.forEach((loc, index) => {
      // Verificar gap antes desta localização (exceto a primeira)
      if (index > 0) {
        const previousLoc = localizacoes[index - 1];
        const intervalMinutes = getIntervalMinutes(previousLoc.capturedAt, loc.capturedAt);

        if (intervalMinutes > 30) {
          items.push({
            type: 'gap',
            data: {
              startTime: previousLoc.capturedAt,
              endTime: loc.capturedAt,
              intervalMinutes,
            },
          });
        }
      }

      // Adicionar a localização
      items.push({
        type: 'location',
        data: loc,
        index: index + 1,
      });
    });

    return items;
  };

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Histórico de Localização do Turno</span>
          {turnoInfo && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {turnoInfo.veiculo?.placa && `Veículo: ${turnoInfo.veiculo.placa}`}
              {turnoInfo.equipe?.nome && ` • Equipe: ${turnoInfo.equipe.nome}`}
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Carregando localizações...</Text>
          </div>
        </div>
      ) : error ? (
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : localizacoes.length === 0 ? (
        <Empty
          description="Nenhuma localização registrada para este turno"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div>
          {/* Informações gerais */}
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <div>
              <Text strong>Total de localizações: </Text>
              <Tag color="blue">{localizacoes.length}</Tag>
            </div>
            <div>
              <Text strong>Período: </Text>
              <Text>
                {formatDateTime(localizacoes[0].capturedAt)} até{' '}
                {formatDateTime(localizacoes[localizacoes.length - 1].capturedAt)}
              </Text>
            </div>
          </Space>

          {/* Mapa com Leaflet */}
          <div style={{ marginBottom: 16, position: 'relative', border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ height: '500px', width: '100%', position: 'relative' }}>
              {localizacoes.length > 0 && (
                <LeafletMap
                  localizacoes={localizacoes}
                  formatDateTime={formatDateTime}
                />
              )}

              {/* Botão para abrir no Google Maps */}
              {generateGoogleMapsLink() && (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}>
                  <a
                    href={generateGoogleMapsLink() || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#1890ff',
                    }}
                  >
                    Abrir no Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lista de localizações */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <Title level={5}>Ordem das Localizações:</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {processLocalizacoesWithGaps().map((item) => {
                if (item.type === 'gap') {
                  const { startTime, endTime, intervalMinutes } = item.data;
                  return (
                    <div
                      key={`gap-${startTime.getTime()}-${endTime.getTime()}`}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #ff4d4f',
                        borderRadius: '4px',
                        backgroundColor: '#fff1f0',
                        boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
                      }}
                    >
                      <Space>
                        <Tag color="red">⚠️</Tag>
                        <Text strong type="danger">
                          Sem captura por {formatInterval(intervalMinutes)}
                        </Text>
                        <Text type="secondary">
                          ({formatDateTime(startTime)} → {formatDateTime(endTime)})
                        </Text>
                      </Space>
                    </div>
                  );
                }

                const loc = item.data;
                const index = item.index! - 1;
                const isFirst = index === 0;
                const isLast = index === localizacoes.length - 1;

                return (
                  <div
                    key={loc.id}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      backgroundColor: isFirst ? '#e6f7ff' : isLast ? '#fff7e6' : '#fafafa',
                    }}
                  >
                    <Space>
                      <Tag color={isFirst ? 'green' : isLast ? 'orange' : 'blue'}>
                        {item.index}
                      </Tag>
                      <Text strong>{formatDateTime(loc.capturedAt)}</Text>
                      <Text type="secondary">
                        ({loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)})
                      </Text>
                      {loc.accuracy && (
                        <Text type="secondary">Precisão: {loc.accuracy.toFixed(0)}m</Text>
                      )}
                      {loc.batteryLevel !== null && (
                        <Tag color={getBatteryColor(loc.batteryLevel)}>
                          🔋 {loc.batteryLevel}%
                        </Tag>
                      )}
                      {loc.tagType && (
                        <Tag>{loc.tagType}</Tag>
                      )}
                    </Space>
                    {loc.tagDetail && (
                      <div style={{ marginTop: 4, marginLeft: 32 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {loc.tagDetail}
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
}
