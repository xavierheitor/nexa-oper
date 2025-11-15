'use client';

import { useState } from 'react';
import { Card, Form, Button, DatePicker, Select, message, Alert, Space, Typography, Checkbox, List } from 'antd';
import { App } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listEquipes } from '@/lib/actions/equipe/list';

const { Title, Text } = Typography;

/**
 * Página para execução manual de reconciliação de turnos
 *
 * Esta página permite executar a reconciliação manualmente para debug,
 * comparando turnos executados com a escala planejada.
 *
 * IMPORTANTE: Este endpoint só funciona de localhost por questões de segurança.
 */
export default function ReconciliacaoManualPage() {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [todasEquipes, setTodasEquipes] = useState(false);
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

  const executarReconciliacao = async (values: {
    dataReferencia: Dayjs;
    equipeId?: number;
  }) => {
    setLoading(true);
    setResultado(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const dataReferencia = values.dataReferencia.format('YYYY-MM-DD');

      const body: any = {
        dataReferencia,
        todasEquipes,
      };

      if (!todasEquipes) {
        if (!values.equipeId) {
          messageApi.error('Selecione uma equipe ou marque "Todas as equipes"');
          setLoading(false);
          return;
        }
        body.equipeId = values.equipeId;
      }

      const response = await fetch(`${apiUrl}/api/turnos-realizados/reconciliacao/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
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
        'Erro ao executar reconciliação. Verifique se está acessando de localhost.';

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
              planejada. Este endpoint só funciona de localhost por questões de segurança.
            </Text>
          </div>

          <Alert
            message="Atenção"
            description="Este endpoint só pode ser acessado de localhost. Se você estiver vendo este erro, certifique-se de estar acessando a aplicação através de localhost ou 127.0.0.1."
            type="warning"
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
    </div>
  );
}

