'use client';

import { useState } from 'react';
import { Card, Space, Typography, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { FiltrosRelatorio } from './components/FiltrosRelatorio';
import { ReprovasPerguntaChart } from './components/ReprovasPerguntaChart';
import { ReprovasEquipeChart } from './components/ReprovasEquipeChart';
import { ReprovasTipoChart } from './components/ReprovasTipoChart';
import { ResumoEstatisticas } from './components/ResumoEstatisticas';
import { useRelatorioData } from './hooks/useRelatorioData';

const { Text } = Typography;

export default function RelatorioSegurancaPage() {
  // Estado para o período (padrão: mês atual)
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Estado para a base selecionada
  const [baseId, setBaseId] = useState<number | undefined>(undefined);

  // Estado para o tipo de equipe selecionado
  const [tipoEquipeId, setTipoEquipeId] = useState<number | undefined>(undefined);

  const {
    bases,
    tiposEquipe,
    dataPerguntas,
    dataEquipes,
    dataTiposChecklist,
    loading,
    loadingBases,
    loadingTiposEquipe,
  } = useRelatorioData(periodo, baseId, tipoEquipeId);

  const handlePeriodoChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setPeriodo([dates[0], dates[1]]);
      // O refetch será automático quando periodo mudar (via deps do useDataFetch)
    }
  };

  const temDados =
    (dataPerguntas && dataPerguntas.length > 0) ||
    (dataEquipes && dataEquipes.length > 0) ||
    (dataTiposChecklist && dataTiposChecklist.length > 0);

  return (
    <Card
      title="Relatório de Segurança"
      extra={
        <FiltrosRelatorio
          periodo={periodo}
          baseId={baseId}
          tipoEquipeId={tipoEquipeId}
          bases={bases}
          tiposEquipe={tiposEquipe}
          loadingBases={loadingBases}
          loadingTiposEquipe={loadingTiposEquipe}
          onPeriodoChange={handlePeriodoChange}
          onBaseChange={setBaseId}
          onTipoEquipeChange={setTipoEquipeId}
        />
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : !temDados ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">
              Nenhuma reprova encontrada no período selecionado.
            </Text>
          </div>
        ) : (
          <>
            {/* Gráfico de Perguntas */}
            <ReprovasPerguntaChart
              data={dataPerguntas}
              loading={loading}
              periodo={periodo}
            />

            {/* Gráfico de Equipes */}
            <ReprovasEquipeChart
              data={dataEquipes}
              loading={loading}
            />

            {/* Gráfico de Tipos de Checklist */}
            <ReprovasTipoChart
              data={dataTiposChecklist}
              loading={loading}
            />
          </>
        )}

        {/* Resumo de Estatísticas */}
        <ResumoEstatisticas
          dataPerguntas={dataPerguntas}
          dataEquipes={dataEquipes}
          dataTiposChecklist={dataTiposChecklist}
        />
      </Space>
    </Card>
  );
}
