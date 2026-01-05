'use client';

import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

/**
 * Componente de Card de Informações sobre Reconciliação
 *
 * Exibe informações sobre o que faz a reconciliação manual
 */
export function InformacoesCard() {
  return (
    <Card size="small" title="Informações">
      <Space direction="vertical" size="small">
        <Text strong>O que faz a reconciliação:</Text>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            Compara turnos realmente executados com a escala planejada
          </li>
          <li>Cria registros de <Text code>Falta</Text> quando escalado não abriu turno</li>
          <li>
            Cria registros de <Text code>DivergenciaEscala</Text> quando abriu em equipe
            diferente
          </li>
          <li>
            Cria registros de <Text code>HoraExtra</Text> quando trabalhou em folga,
            extrafora, ou compensou atraso
          </li>
        </ul>
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
          <Text strong>Importante:</Text> Apenas escalas com status <Text code>PUBLICADA</Text>{' '}
          são consideradas na reconciliação.
        </Text>
      </Space>
    </Card>
  );
}

