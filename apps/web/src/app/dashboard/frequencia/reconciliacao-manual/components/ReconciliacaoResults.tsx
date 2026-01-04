'use client';

import { Card, Alert, List, Space, Typography } from 'antd';

const { Text } = Typography;

interface ResultadoItem {
  equipeId: number;
  success: boolean;
  message?: string;
  error?: string;
}

interface ResultadoReconciliacao {
  success: boolean;
  message?: string;
  error?: string;
  equipesProcessadas?: number;
  sucessos?: number;
  erros?: number;
  resultados?: ResultadoItem[];
}

interface ReconciliacaoResultsProps {
  resultado: ResultadoReconciliacao | null;
}

/**
 * Componente de Resultados da Reconciliação Manual
 *
 * Exibe card com Alert de sucesso/erro e lista detalhada de resultados por equipe
 */
export function ReconciliacaoResults({ resultado }: ReconciliacaoResultsProps) {
  if (!resultado) {
    return null;
  }

  return (
    <Card size="small">
      <Alert
        message={resultado.success ? 'Sucesso' : 'Erro'}
        description={
          resultado.success ? (
            <div>
              <Text strong>{resultado.message}</Text>
              {resultado.equipesProcessadas !== undefined && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                    Equipes processadas: {resultado.equipesProcessadas} | Sucessos: {resultado.sucessos || 0}{' '}
                    | Erros: {resultado.erros || 0}
                  </Text>
                </>
              )}
              <br />
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Verifique o banco de dados para ver os registros criados (Faltas, Horas Extras,
                Divergências).
              </Text>
            </div>
          ) : (
            <Text>{resultado.error}</Text>
          )
        }
        type={resultado.success ? 'success' : 'error'}
        showIcon
        style={{ marginBottom: resultado.resultados && resultado.resultados.length > 0 ? '16px' : 0 }}
      />

      {resultado.resultados && resultado.resultados.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>Detalhamento por equipe:</Text>
          <List
            size="small"
            dataSource={resultado.resultados}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Text>{item.success ? '✅' : '❌'}</Text>
                  <Text>
                    Equipe {item.equipeId}: {item.success ? item.message : item.error}
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

