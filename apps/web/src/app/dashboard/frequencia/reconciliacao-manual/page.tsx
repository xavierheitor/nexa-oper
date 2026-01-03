'use client';

import { useState } from 'react';
import { Card, Form, Button, DatePicker, Select, message, Alert, Space, Typography, Checkbox, List, InputNumber, Table, Tag, Spin } from 'antd';
import { App } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listEquipes } from '@/lib/actions/equipe/list';
import { reconciliarManual } from '@/lib/actions/turno-realizado/reconciliarManual';
import { reconciliarForcado } from '@/lib/actions/turno-realizado/reconciliarForcado';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

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
interface PendenteReconciliacao {
  equipeId: number;
  data: string;
  equipeNome?: string;
}

interface ResultadoForcado {
  success: boolean;
  message?: string;
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
  const [resultado, setResultado] = useState<{
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
  } | null>(null);

  // Carregar equipes
  const { data: equipesData } = useDataFetch<Array<{ id: number; nome: string }>>(
    async () => {
      const result = await listEquipes({ page: 1, pageSize: 1000 });
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : result.data.data;
        return data.map((e: any) => ({ id: e.id, nome: e.nome }));
      }
      throw new Error(result.error || 'Erro ao carregar equipes');
    },
    []
  );

  // Garantir que equipes sempre seja um array
  const equipes = equipesData || [];

  // Buscar pendências de reconciliação usando server action
  const buscarPendentes = async (diasHistorico: number = 30) => {
    setLoadingPendentes(true);
    try {
      // Usar server action do Next.js ao invés de endpoint REST
      const { listEscalasEquipePeriodo } = await import('@/lib/actions/escala/escalaEquipePeriodo');

      const agora = new Date();
      const dataFim = new Date(agora);
      dataFim.setHours(23, 59, 59, 999);
      const dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - diasHistorico);
      dataInicio.setHours(0, 0, 0, 0);

      // Buscar escalas usando server action
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

      // Coletar pendências (dias com slots)
      const pendentesEncontrados: PendenteReconciliacao[] = [];
      const equipesMap = new Map<number, string>();

      // Mapear nomes das equipes
      for (const escala of escalas) {
        if (escala.equipeId && !equipesMap.has(escala.equipeId)) {
          equipesMap.set(escala.equipeId, escala.equipe?.nome || `Equipe ${escala.equipeId}`);
        }
      }

      // Para cada escala, verificar dias com slots
      for (const escala of escalas) {
        const dataAtual = new Date(dataInicio);
        while (dataAtual <= dataFim) {
          const dataStr = dataAtual.toISOString().split('T')[0];

          // Verificar se a data está dentro do período da escala
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

      // Remover duplicatas
      const pendentesUnicos = Array.from(
        new Map(pendentesEncontrados.map(p => [`${p.equipeId}-${p.data}`, p])).values()
      );

      setPendentes(pendentesUnicos);
      messageApi.success(`Encontradas ${pendentesUnicos.length} possíveis pendências de reconciliação`);
    } catch (error: any) {
      messageApi.error(error.message || 'Erro ao buscar pendências');
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
      const body: any = {};

      if (values.dataInicio && values.dataFim) {
        body.dataInicio = values.dataInicio.format('YYYY-MM-DD');
        body.dataFim = values.dataFim.format('YYYY-MM-DD');
      } else {
        body.diasHistorico = values.diasHistorico || 30;
      }

      // Usar Server Action em vez de fetch direto
      const result = await reconciliarForcado(body);

      // Verificar se houve erro na Server Action
      if (!result.success) {
        throw new Error(result.error || 'Erro ao executar reconciliação forçada');
      }

      // Se chegou aqui, result.data contém os dados
      const data = result.data;

      if (!data) {
        throw new Error('Dados não retornados pela reconciliação forçada');
      }

      setResultadoForcado(data);

      if (data.success) {
        messageApi.success(
          `Reconciliação forçada executada: ${data.sucessos || 0} sucesso(s), ${data.erros || 0} erro(s)`
        );
        // Atualizar lista de pendentes após execução
        if (values.diasHistorico) {
          await buscarPendentes(values.diasHistorico);
        }
      } else {
        messageApi.warning(data.message || 'Reconciliação executada com alguns erros');
      }
    } catch (error: any) {
      const errorMessage =
        error.message ||
        'Erro ao executar reconciliação forçada.';

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
      // Validação no cliente antes de chamar a Server Action
      if (!todasEquipes && !values.equipeId) {
        messageApi.error('Selecione uma equipe ou marque "Todas as equipes"');
        setLoading(false);
        return;
      }

      const dataReferencia = values.dataReferencia.format('YYYY-MM-DD');

      // Usar Server Action em vez de fetch direto
      const result = await reconciliarManual({
        dataReferencia,
        todasEquipes,
        equipeId: todasEquipes ? undefined : values.equipeId,
      });

      // Verificar se houve erro na Server Action
      if (!result.success) {
        throw new Error(result.error || 'Erro ao executar reconciliação');
      }

      // Se chegou aqui, result.data contém os dados da API
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
        // Mesmo que HTTP seja 200, se success=false, mostrar como aviso
        if (data.equipesProcessadas === 0) {
          messageApi.warning(data.message || 'Nenhuma equipe encontrada para processar');
        } else {
          messageApi.warning(
            data.message || `Reconciliação executada com alguns erros. ${data.sucessos || 0} sucesso(s), ${data.erros || 0} erro(s).`
          );
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.message ||
        'Erro ao executar reconciliação.';

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

          <Form
            form={form}
            layout="vertical"
            onFinish={executarReconciliacao}
            initialValues={{
              dataReferencia: dayjs(),
            }}
          >
            <Form.Item>
              <Checkbox
                checked={todasEquipes}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTodasEquipes(checked);
                  if (checked) {
                    // Limpar o campo equipeId quando marcar "todas equipes"
                    form.resetFields(['equipeId']);
                  }
                }}
              >
                Executar para todas as equipes com escala publicada
              </Checkbox>
            </Form.Item>

            {!todasEquipes && (
              <Form.Item
                name="equipeId"
                label="Equipe"
                rules={[{ required: !todasEquipes, message: 'Selecione uma equipe' }]}
              >
                <Select
                  placeholder="Selecione uma equipe"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={equipes.map((e) => ({
                    value: e.id,
                    label: `${e.nome} (ID: ${e.id})`,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="dataReferencia"
              label="Data de Referência"
              rules={[{ required: true, message: 'Selecione uma data' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Selecione a data"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Executar Reconciliação
              </Button>
            </Form.Item>
          </Form>

          {resultado && (
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
          )}

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

          <Form
            form={formForcado}
            layout="vertical"
            onFinish={executarReconciliacaoForcada}
            initialValues={{
              diasHistorico: 30,
            }}
          >
            <Form.Item
              name="diasHistorico"
              label="Dias no Histórico"
              tooltip="Número de dias para buscar no histórico (padrão: 30)"
            >
              <InputNumber
                min={1}
                max={365}
                style={{ width: '100%' }}
                placeholder="30"
              />
            </Form.Item>

            <Form.Item label="OU Período Específico">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="dataInicio"
                  noStyle
                  tooltip="Data de início (opcional)"
                >
                  <DatePicker
                    style={{ width: '50%' }}
                    format="DD/MM/YYYY"
                    placeholder="Data início"
                  />
                </Form.Item>
                <Form.Item
                  name="dataFim"
                  noStyle
                  tooltip="Data de fim (opcional)"
                >
                  <DatePicker
                    style={{ width: '50%' }}
                    format="DD/MM/YYYY"
                    placeholder="Data fim"
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loadingForcado}
                  icon={<ReloadOutlined />}
                >
                  Executar Reconciliação Forçada
                </Button>
                <Button
                  onClick={() => {
                    const dias = formForcado.getFieldValue('diasHistorico') || 30;
                    buscarPendentes(dias);
                  }}
                  loading={loadingPendentes}
                >
                  Verificar Pendências
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {pendentes.length > 0 && (
            <Card size="small" title={`Pendências Encontradas (${pendentes.length})`}>
              <Table
                dataSource={pendentes}
                rowKey={(record) => `${record.equipeId}-${record.data}`}
                pagination={{ pageSize: 10 }}
                size="small"
                columns={[
                  {
                    title: 'Equipe',
                    dataIndex: 'equipeNome',
                    key: 'equipeNome',
                  },
                  {
                    title: 'Equipe ID',
                    dataIndex: 'equipeId',
                    key: 'equipeId',
                  },
                  {
                    title: 'Data',
                    dataIndex: 'data',
                    key: 'data',
                    render: (data: string) => dayjs(data).format('DD/MM/YYYY'),
                  },
                ]}
              />
            </Card>
          )}

          {resultadoForcado && (
            <Card size="small">
              <Alert
                message={resultadoForcado.success ? 'Sucesso' : 'Atenção'}
                description={
                  <div>
                    <Text strong>{resultadoForcado.message}</Text>
                    {resultadoForcado.periodo && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                          Período: {dayjs(resultadoForcado.periodo.dataInicio).format('DD/MM/YYYY')} até{' '}
                          {dayjs(resultadoForcado.periodo.dataFim).format('DD/MM/YYYY')}
                        </Text>
                      </>
                    )}
                    {resultadoForcado.diasProcessados !== undefined && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                          Dias processados: {resultadoForcado.diasProcessados} | Equipes: {resultadoForcado.equipesProcessadas || 0} |
                          Sucessos: <Tag color="success">{resultadoForcado.sucessos || 0}</Tag> |
                          Erros: <Tag color="error">{resultadoForcado.erros || 0}</Tag>
                        </Text>
                      </>
                    )}
                  </div>
                }
                type={resultadoForcado.success ? 'success' : 'warning'}
                showIcon
                style={{ marginBottom: resultadoForcado.resultados && resultadoForcado.resultados.length > 0 ? '16px' : 0 }}
              />

              {resultadoForcado.resultados && resultadoForcado.resultados.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong>Detalhamento:</Text>
                  <List
                    size="small"
                    dataSource={resultadoForcado.resultados}
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
          )}
        </Space>
      </Card>
    </div>
  );
}

