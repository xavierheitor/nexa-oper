'use client';

import { Card, Space, Typography, Spin } from 'antd';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface ReprovaPorPergunta {
  perguntaId: number;
  perguntaNome: string;
  quantidade: number;
}

interface ReprovaPorEquipe {
  equipeId: number;
  equipeNome: string;
  quantidade: number;
}

interface ReprovaPorTipoChecklist {
  tipoChecklistId: number;
  tipoChecklistNome: string;
  quantidade: number;
}

interface ResumoEstatisticasProps {
  dataPerguntas?: ReprovaPorPergunta[] | null;
  dataEquipes?: ReprovaPorEquipe[] | null;
  dataTiposChecklist?: ReprovaPorTipoChecklist[] | null;
}

const { Text } = Typography;

/**
 * Componente de Resumo de Estatísticas do Relatório de Segurança
 *
 * Exibe card com resumo consolidado das reprovas:
 * - Total de reprovas por perguntas
 * - Total de reprovas por equipes
 * - Total de reprovas por tipos de checklist
 */
export function ResumoEstatisticas({
  dataPerguntas,
  dataEquipes,
  dataTiposChecklist,
}: ResumoEstatisticasProps) {
  // Check de hidratação
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card size="small" title="Resumo">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="small" />
        </div>
      </Card>
    );
  }

  const perguntas = dataPerguntas ?? [];
  const equipes = dataEquipes ?? [];
  const tiposChecklist = dataTiposChecklist ?? [];

  const temDados = perguntas.length > 0 || equipes.length > 0 || tiposChecklist.length > 0;

  if (!temDados) {
    return null;
  }

  return (
    <Card size="small" title="Resumo">
      <Space direction="vertical">
        {perguntas.length > 0 && (
          <>
            <Text>
              <strong>Total de reprovas (perguntas):</strong>{' '}
              {perguntas.reduce((acc, item) => acc + item.quantidade, 0)}
            </Text>
            <Text>
              <strong>Perguntas com reprovas:</strong> {perguntas.length}
            </Text>
            {perguntas.length > 10 && (
              <Text type="secondary">
                Mostrando apenas as top 10 perguntas. Existem mais {perguntas.length - 10}{' '}
                perguntas com reprovas.
              </Text>
            )}
          </>
        )}
        {equipes.length > 0 && (
          <>
            <Text>
              <strong>Total de reprovas (equipes):</strong>{' '}
              {equipes.reduce((acc, item) => acc + item.quantidade, 0)}
            </Text>
            <Text>
              <strong>Equipes com reprovas:</strong> {equipes.length}
            </Text>
            {equipes.length > 10 && (
              <Text type="secondary">
                Mostrando apenas as top 10 equipes. Existem mais{' '}
                {equipes.length - 10} equipes com reprovas.
              </Text>
            )}
          </>
        )}
        {tiposChecklist.length > 0 && (
          <>
            <Text>
              <strong>Total de reprovas (tipos de checklist):</strong>{' '}
              {tiposChecklist.reduce((acc, item) => acc + item.quantidade, 0)}
            </Text>
            <Text>
              <strong>Tipos de checklist com reprovas:</strong>{' '}
              {tiposChecklist.length}
            </Text>
          </>
        )}
      </Space>
    </Card>
  );
}

