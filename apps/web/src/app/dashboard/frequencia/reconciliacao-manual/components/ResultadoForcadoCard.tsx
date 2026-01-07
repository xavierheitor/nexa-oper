'use client';

import { Card, Alert, List, Space, Typography, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ResultadoItemForcado {
  equipeId: number;
  data: string;
  success: boolean;
  message?: string;
  error?: string;
}

interface ResultadoForcado {
  success: boolean;
  message?: string;
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  stats?: {
    created: number;
    updated: number;
    closed: number;
    skipped: number;
  };
  warnings?: string[];
  periodo?: {
    dataInicio: string;
    dataFim: string;
  };
  equipesProcessadas?: number;
  diasProcessados?: number;
  sucessos?: number;
  erros?: number;
  resultados?: ResultadoItemForcado[];
}

interface ResultadoForcadoCardProps {
  resultado: ResultadoForcado | null;
}

const { Text } = Typography;

/**
 * Componente de Card de Resultado da Reconciliação Forçada
 *
 * Exibe card com Alert e lista detalhada de resultados da reconciliação forçada
 */
export function ResultadoForcadoCard({ resultado }: ResultadoForcadoCardProps) {
  if (!resultado) {
    return null;
  }

  return (
    <Card size="small">
      <Alert
        message={resultado.success ? 'Sucesso' : 'Atenção'}
        description={
          <div>
            <Text strong>{resultado.message}</Text>
            {resultado.periodo && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Período: {dayjs(resultado.periodo.dataInicio).format('DD/MM/YYYY')} até{' '}
                  {dayjs(resultado.periodo.dataFim).format('DD/MM/YYYY')}
                </Text>
              </>
            )}
            {resultado.stats && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Criados: <Tag color="success">{resultado.stats.created}</Tag> |
                  Atualizados: <Tag color="processing">{resultado.stats.updated}</Tag> |
                  Fechados: <Tag color="default">{resultado.stats.closed}</Tag> |
                  Ignorados: <Tag color="warning">{resultado.stats.skipped}</Tag>
                </Text>
              </>
            )}
            {resultado.runId && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Run ID: {resultado.runId} | Duração: {resultado.durationMs ? `${(resultado.durationMs / 1000).toFixed(2)}s` : '-'}
                </Text>
              </>
            )}
            {resultado.warnings && resultado.warnings.length > 0 && (
              <>
                <br />
                <Text type="warning" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Avisos: {resultado.warnings.join(', ')}
                </Text>
              </>
            )}
          </div>
        }
        type={resultado.success ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: resultado.resultados && resultado.resultados.length > 0 ? '16px' : 0 }}
      />

      {resultado.resultados && resultado.resultados.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>Detalhamento:</Text>
          <List
            size="small"
            dataSource={resultado.resultados}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  {item.success ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  <Text>
                    Equipe {item.equipeId} - {dayjs(item.data).format('DD/MM/YYYY')}:{' '}
                    {item.success ? item.message : item.error}
                  </Text>
                </Space>
              </List.Item>
            )}
            style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}
          />
        </div>
      )}
    </Card>
  );
}

