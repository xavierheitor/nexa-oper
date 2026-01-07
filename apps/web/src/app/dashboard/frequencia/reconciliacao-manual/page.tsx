'use client';

/**
 * Página para execução manual de reconciliação de turnos
 *
 * Esta página permite executar a reconciliação manualmente para debug,
 * comparando turnos executados com a escala planejada.
 *
 * A reconciliação é executada através de uma Server Action, que faz a requisição
 * do servidor Next.js (visto como localhost pela API), permitindo funcionar
 * tanto em desenvolvimento quanto em produção.
 */

import { useState } from 'react';
import { Card, Form, Alert, Space, Typography } from 'antd';
import { App } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { reconciliarManual } from '@/lib/actions/turno-realizado/reconciliarManual';
import { forcarReconciliacaoTurnos, type ForcarReconciliacaoResult } from '@/lib/actions/admin/forcarReconciliacaoTurnos';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import { ReconciliacaoForm } from './components/ReconciliacaoForm';
import { ReconciliacaoResults } from './components/ReconciliacaoResults';
import { InformacoesCard } from './components/InformacoesCard';
import { ReconciliacaoForcadaForm } from './components/ReconciliacaoForcadaForm';
import { PendentesTable } from './components/PendentesTable';
import { ResultadoForcadoCard } from './components/ResultadoForcadoCard';
import { useReconciliacao } from './hooks/useReconciliacao';

const { Title, Text } = Typography;

interface PendenteReconciliacao {
  equipeId: number;
  data: string;
  equipeNome?: string;
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
  resultados?: Array<{
    equipeId: number;
    data: string;
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

interface ResultadoReconciliacao {
  success: boolean;
  message?: string;
  error?: string;
  equipesProcessadas?: number;
  sucessos?: number;
  erros?: number;
  resultados?: Array<{
    equipeId: number;
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

export default function ReconciliacaoManualPage() {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [formForcado] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingForcado, setLoadingForcado] = useState(false);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [todasEquipes, setTodasEquipes] = useState(false);
  const [pendentes, setPendentes] = useState<PendenteReconciliacao[]>([]);
  const [resultadoForcado, setResultadoForcado] = useState<ResultadoForcado | null>(null);
  const [resultado, setResultado] = useState<ResultadoReconciliacao | null>(null);

  const { equipes, error: errorEquipes, refetch: refetchEquipes } = useReconciliacao();

  // Buscar pendências de reconciliação usando server action
  const buscarPendentes = async (diasHistorico: number = 30) => {
    setLoadingPendentes(true);
    try {
      const { listEscalasEquipePeriodo } = await import('@/lib/actions/escala/escalaEquipePeriodo');

      const agora = new Date();
      const dataFim = new Date(agora);
      dataFim.setHours(23, 59, 59, 999);
      const dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - diasHistorico);
      dataInicio.setHours(0, 0, 0, 0);

      const result = await listEscalasEquipePeriodo({
        page: 1,
        pageSize: 1000,
        status: 'PUBLICADA',
        periodoInicio: dataInicio,
        periodoFim: dataFim,
        orderBy: 'periodoInicio',
        orderDir: 'desc',
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar escalas');
      }

      const escalas = Array.isArray(result.data) ? result.data : result.data.data || [];

      const pendentesEncontrados: PendenteReconciliacao[] = [];
      const equipesMap = new Map<number, string>();

      for (const escala of escalas) {
        if (escala.equipeId && !equipesMap.has(escala.equipeId)) {
          equipesMap.set(escala.equipeId, escala.equipe?.nome || `Equipe ${escala.equipeId}`);
        }
      }

      for (const escala of escalas) {
        const dataAtual = new Date(dataInicio);
        while (dataAtual <= dataFim) {
          const dataStr = dataAtual.toISOString().split('T')[0];
          const dataRef = new Date(dataStr);
          const periodoInicio = new Date(escala.periodoInicio);
          const periodoFim = new Date(escala.periodoFim);
          if (dataRef >= periodoInicio && dataRef <= periodoFim) {
            pendentesEncontrados.push({
              equipeId: escala.equipeId,
              data: dataStr,
              equipeNome: equipesMap.get(escala.equipeId) || `Equipe ${escala.equipeId}`,
            });
          }
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }

      const pendentesUnicos = Array.from(
        new Map(pendentesEncontrados.map(p => [`${p.equipeId}-${p.data}`, p])).values()
      );

      setPendentes(pendentesUnicos);
      messageApi.success(`Encontradas ${pendentesUnicos.length} possíveis pendências de reconciliação`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar pendências';
      messageApi.error(errorMessage);
      setPendentes([]);
    } finally {
      setLoadingPendentes(false);
    }
  };

  // Executar reconciliação forçada
  const executarReconciliacaoForcada = async (values: {
    diasHistorico?: number;
    dataInicio?: Dayjs;
    dataFim?: Dayjs;
  }) => {
    setLoadingForcado(true);
    setResultadoForcado(null);

    try {
      // Preparar parâmetros para a API
      const params: {
        dataReferencia?: string;
        intervaloDias?: number;
        equipeId?: number;
        dryRun?: boolean;
      } = {};

      if (values.dataInicio && values.dataFim) {
        // Se tem período específico, usar data de referência e calcular intervalo
        params.dataReferencia = values.dataInicio.format('YYYY-MM-DD');
        const diffDays = values.dataFim.diff(values.dataInicio, 'day') + 1;
        params.intervaloDias = diffDays;
      } else {
        // Se não tem período, usar dias de histórico a partir de hoje
        params.intervaloDias = values.diasHistorico || 30;
        // dataReferencia não informada = usa hoje
      }

      const result = await forcarReconciliacaoTurnos(params);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao executar reconciliação forçada');
      }

      // Converter resultado da API para o formato esperado pelo componente
      const resultadoFormatado: ResultadoForcado = {
        success: result.success,
        runId: result.runId,
        startedAt: result.startedAt,
        finishedAt: result.finishedAt,
        durationMs: result.durationMs,
        stats: result.stats,
        warnings: result.warnings,
        message: result.stats
          ? `Criados: ${result.stats.created}, Atualizados: ${result.stats.updated}, Fechados: ${result.stats.closed}, Ignorados: ${result.stats.skipped}`
          : 'Reconciliação executada',
      };

      setResultadoForcado(resultadoFormatado);

      if (result.success) {
        const stats = result.stats;
        const message = stats
          ? `Reconciliação executada com sucesso! Criados: ${stats.created}, Atualizados: ${stats.updated}, Fechados: ${stats.closed}, Ignorados: ${stats.skipped}`
          : 'Reconciliação executada com sucesso!';

        messageApi.success(message);

        if (result.warnings && result.warnings.length > 0) {
          messageApi.warning(`Avisos: ${result.warnings.join(', ')}`);
        }

        if (values.diasHistorico) {
          await buscarPendentes(values.diasHistorico);
        }
      } else {
        messageApi.error(result.error || 'Erro ao executar reconciliação');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao executar reconciliação forçada.';

      setResultadoForcado({
        success: false,
        message: errorMessage,
      });

      messageApi.error(errorMessage);
    } finally {
      setLoadingForcado(false);
    }
  };

  const executarReconciliacao = async (values: {
    dataReferencia: Dayjs;
    equipeId?: number;
  }) => {
    setLoading(true);
    setResultado(null);

    try {
      if (!todasEquipes && !values.equipeId) {
        messageApi.error('Selecione uma equipe ou marque "Todas as equipes"');
        setLoading(false);
        return;
      }

      const dataReferencia = values.dataReferencia.format('YYYY-MM-DD');

      const result = await reconciliarManual({
        dataReferencia,
        todasEquipes,
        equipeId: todasEquipes ? undefined : values.equipeId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao executar reconciliação');
      }

      const data = result.data;

      if (!data) {
        throw new Error('Dados não retornados pela reconciliação');
      }

      setResultado(data);

      if (data.success) {
        messageApi.success(
          todasEquipes
            ? `Reconciliação executada para ${data.sucessos || 0} equipe(s) com sucesso!`
            : 'Reconciliação executada com sucesso!'
        );
      } else {
        if (data.equipesProcessadas === 0) {
          messageApi.warning(data.message || 'Nenhuma equipe encontrada para processar');
        } else {
          messageApi.warning(
            data.message || `Reconciliação executada com alguns erros. ${data.sucessos || 0} sucesso(s), ${data.erros || 0} erro(s).`
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao executar reconciliação.';

      setResultado({
        success: false,
        error: errorMessage,
      });

      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Tratamento de Erros */}
      <ErrorAlert error={errorEquipes} onRetry={refetchEquipes} />

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>Reconciliação Manual de Turnos</Title>
            <Text type="secondary">
              Execute a reconciliação manualmente para comparar turnos executados com a escala
              planejada. A reconciliação é executada de forma segura através de uma Server Action.
            </Text>
          </div>

          <Alert
            message="Atenção"
            description="A reconciliação manual é executada através de uma Server Action, garantindo acesso seguro mesmo em produção."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <ReconciliacaoForm
            form={form}
            equipes={equipes}
            todasEquipes={todasEquipes}
            loading={loading}
            onTodasEquipesChange={setTodasEquipes}
            onSubmit={executarReconciliacao}
          />

          <ReconciliacaoResults resultado={resultado} />

          <InformacoesCard />
        </Space>
      </Card>

      {/* Seção de Reconciliação Forçada */}
      <Card style={{ marginTop: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>Reconciliação Forçada</Title>
            <Text type="secondary">
              Verifica e reconcilia forçadamente todos os dias/equipes pendentes no período especificado.
              Ignora a margem de 30 minutos e processa tudo que encontrar.
            </Text>
          </div>

          <ReconciliacaoForcadaForm
            form={formForcado}
            loading={loadingForcado}
            loadingPendentes={loadingPendentes}
            onSubmit={executarReconciliacaoForcada}
            onVerificarPendentes={() => {
              const dias = formForcado.getFieldValue('diasHistorico') || 30;
              buscarPendentes(dias);
            }}
          />

          <PendentesTable pendentes={pendentes} />

          <ResultadoForcadoCard resultado={resultadoForcado} />
        </Space>
      </Card>
    </div>
  );
}
