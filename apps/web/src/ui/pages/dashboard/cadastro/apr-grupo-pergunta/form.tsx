'use client';

import { Alert, App, Button, Card, Empty, Form, Input, Select, Spin, Transfer } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

import { getAprGrupoPergunta } from '@/lib/actions/aprGrupoPergunta/get';
import { listAprMedidasControle } from '@/lib/actions/aprMedidaControle/list';
import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';
import type { AprMedidaControle, AprOpcaoResposta, AprPergunta } from '@nexa-oper/db';

export interface AprGrupoPerguntaFormData {
  nome: string;
  tipoResposta: 'opcao' | 'checkbox' | 'texto';
  perguntaIds: number[];
  opcaoRespostaIds: number[];
  medidasControlePorPergunta: Record<string, number[]>;
}

interface Props {
  onSubmit: (values: AprGrupoPerguntaFormData) => void;
  initialValues?: Partial<AprGrupoPerguntaFormData & { id: number }>;
  loading?: boolean;
}

export default function AprGrupoPerguntaForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AprGrupoPerguntaFormData>();

  const [perguntas, setPerguntas] = useState<AprPergunta[]>([]);
  const [opcoes, setOpcoes] = useState<AprOpcaoResposta[]>([]);
  const [medidasControle, setMedidasControle] = useState<AprMedidaControle[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const [targetOpcoes, setTargetOpcoes] = useState<string[]>([]);
  const [medidasPorPergunta, setMedidasPorPergunta] = useState<Record<string, string[]>>({});

  const tipoResposta = Form.useWatch('tipoResposta', form);

  const perguntaItems = useMemo<TransferItem[]>(
    () => perguntas.map((p) => ({ key: String(p.id), title: p.nome })),
    [perguntas]
  );

  const opcaoItems = useMemo<TransferItem[]>(
    () =>
      opcoes.map((o) => ({
        key: String(o.id),
        title: o.geraPendencia ? `${o.nome} (gera pendência)` : o.nome,
      })),
    [opcoes]
  );

  const medidasControleOptions = useMemo(
    () =>
      medidasControle.map((medida) => ({
        value: String(medida.id),
        label: medida.nome,
      })),
    [medidasControle]
  );

  const perguntasSelecionadas = useMemo(
    () => perguntas.filter((pergunta) => targetPerguntas.includes(String(pergunta.id))),
    [perguntas, targetPerguntas]
  );

  const hasOpcaoQueGeraPendenciaSelecionada = useMemo(() => {
    const opcoesSelecionadas = new Set(targetOpcoes);
    return opcoes.some(
      (opcao) => opcoesSelecionadas.has(String(opcao.id)) && opcao.geraPendencia
    );
  }, [opcoes, targetOpcoes]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [perguntasRes, opcoesRes, medidasRes] = await Promise.all([
          listAprPerguntas({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listAprOpcoesResposta({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listAprMedidasControle({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);

        setPerguntas(perguntasRes.data?.data || []);
        setOpcoes(opcoesRes.data?.data || []);
        setMedidasControle(medidasRes.data?.data || []);
      } catch (error) {
        console.error(error);
        message.error('Erro ao carregar perguntas, opções e medidas de controle');
      } finally {
        setLoadingSources(false);
      }
    };

    load();
  }, [message]);

  useEffect(() => {
    const applyInitial = async () => {
      if (!initialValues) {
        form.resetFields();
        form.setFieldsValue({ tipoResposta: 'checkbox' });
        setTargetPerguntas([]);
        setTargetOpcoes([]);
        setMedidasPorPergunta({});
        return;
      }

      form.setFieldsValue({
        nome: initialValues.nome,
        tipoResposta: initialValues.tipoResposta || 'checkbox',
        perguntaIds: initialValues.perguntaIds || [],
        opcaoRespostaIds: initialValues.opcaoRespostaIds || [],
        medidasControlePorPergunta: initialValues.medidasControlePorPergunta || {},
      });

      if (initialValues.id) {
        const res = await getAprGrupoPergunta({ id: initialValues.id });
        const data = res.data;

        if (
          data &&
          'AprGrupoPerguntaRelacao' in data &&
          'AprGrupoOpcaoRespostaRelacao' in data &&
          'AprGrupoPerguntaMedidaControleRelacao' in data
        ) {
          const perguntaRelacoes =
            (data as { AprGrupoPerguntaRelacao?: Array<{ aprPerguntaId: number }> })
              .AprGrupoPerguntaRelacao || [];
          const opcaoRelacoes =
            (data as { AprGrupoOpcaoRespostaRelacao?: Array<{ aprOpcaoRespostaId: number }> })
              .AprGrupoOpcaoRespostaRelacao || [];
          const medidaRelacoes =
            (
              data as {
                AprGrupoPerguntaMedidaControleRelacao?: Array<{
                  aprPerguntaId: number;
                  aprMedidaControleId: number;
                }>;
              }
            ).AprGrupoPerguntaMedidaControleRelacao || [];

          setTargetPerguntas(perguntaRelacoes.map((item) => String(item.aprPerguntaId)));
          setTargetOpcoes(opcaoRelacoes.map((item) => String(item.aprOpcaoRespostaId)));
          setMedidasPorPergunta(
            medidaRelacoes.reduce<Record<string, string[]>>((acc, item) => {
              const key = String(item.aprPerguntaId);
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(String(item.aprMedidaControleId));
              return acc;
            }, {})
          );
        }
      } else {
        setTargetPerguntas((initialValues.perguntaIds || []).map(String));
        setTargetOpcoes((initialValues.opcaoRespostaIds || []).map(String));
        setMedidasPorPergunta(
          Object.fromEntries(
            Object.entries(initialValues.medidasControlePorPergunta || {}).map(
              ([perguntaId, medidaIds]) => [perguntaId, medidaIds.map(String)]
            )
          )
        );
      }
    };

    applyInitial();
  }, [initialValues, form]);

  useEffect(() => {
    if (tipoResposta !== 'opcao') {
      setTargetOpcoes([]);
      setMedidasPorPergunta({});
    }
  }, [tipoResposta]);

  useEffect(() => {
    setMedidasPorPergunta((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([perguntaId]) =>
          targetPerguntas.includes(perguntaId)
        )
      )
    );
  }, [targetPerguntas]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(vals) => {
          if (vals.tipoResposta === 'opcao' && hasOpcaoQueGeraPendenciaSelecionada) {
            const perguntasSemMedida = perguntasSelecionadas.filter(
              (pergunta) => !medidasPorPergunta[String(pergunta.id)]?.length
            );

            if (perguntasSemMedida.length > 0) {
              message.error(
                'Configure ao menos uma medida de controle para cada pergunta do grupo.'
              );
              return;
            }
          }

          onSubmit({
            nome: vals.nome,
            tipoResposta: vals.tipoResposta,
            perguntaIds: targetPerguntas.map(Number),
            opcaoRespostaIds: vals.tipoResposta === 'opcao' ? targetOpcoes.map(Number) : [],
            medidasControlePorPergunta:
              vals.tipoResposta === 'opcao'
                ? Object.fromEntries(
                    Object.entries(medidasPorPergunta)
                      .filter(([perguntaId]) => targetPerguntas.includes(perguntaId))
                      .map(([perguntaId, medidaIds]) => [
                        perguntaId,
                        Array.from(new Set(medidaIds.map(Number).filter(Boolean))),
                      ])
                      .filter(([, medidaIds]) => medidaIds.length > 0)
                  )
                : {},
          });
        }}
      >
        <Form.Item
          name="nome"
          label="Nome do grupo"
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input autoFocus placeholder="Digite o nome do grupo" showCount maxLength={255} />
        </Form.Item>

        <Form.Item
          name="tipoResposta"
          label="Tipo de resposta"
          rules={[{ required: true, message: 'Selecione o tipo de resposta' }]}
        >
          <Select
            options={[
              { value: 'checkbox', label: 'Checkbox' },
              { value: 'texto', label: 'Texto' },
              { value: 'opcao', label: 'Opção' },
            ]}
          />
        </Form.Item>

        <Card
          size="small"
          title="Perguntas do grupo"
          style={{ marginTop: 12 }}
          loading={loadingSources}
        >
          <Transfer
            dataSource={perguntaItems}
            targetKeys={targetPerguntas}
            onChange={(nextTarget) => setTargetPerguntas(nextTarget.map(String))}
            render={(item) => item.title as string}
            listStyle={{ width: '48%', height: 280 }}
            titles={['Disponíveis', 'Selecionadas']}
            showSearch
            filterOption={(inputValue, item) =>
              item.title!.toLowerCase().includes(inputValue.toLowerCase())
            }
            disabled={loadingSources}
          />
        </Card>

        {tipoResposta === 'opcao' ? (
          <>
            <Card
              size="small"
              title="Opções de resposta do grupo"
              style={{ marginTop: 12 }}
              loading={loadingSources}
            >
              <Transfer
                dataSource={opcaoItems}
                targetKeys={targetOpcoes}
                onChange={(nextTarget) => setTargetOpcoes(nextTarget.map(String))}
                render={(item) => item.title as string}
                listStyle={{ width: '48%', height: 280 }}
                titles={['Disponíveis', 'Selecionadas']}
                showSearch
                filterOption={(inputValue, item) =>
                  item.title!.toLowerCase().includes(inputValue.toLowerCase())
                }
                disabled={loadingSources}
              />
            </Card>

            <Card
              size="small"
              title="Medidas de controle por pergunta"
              style={{ marginTop: 12 }}
              loading={loadingSources}
            >
              {hasOpcaoQueGeraPendenciaSelecionada ? (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="As perguntas deste grupo precisarão de medidas de controle quando o usuário marcar uma opção que gera pendência."
                />
              ) : null}

              {perguntasSelecionadas.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Selecione ao menos uma pergunta para configurar as medidas."
                />
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {perguntasSelecionadas.map((pergunta) => (
                    <div
                      key={pergunta.id}
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{pergunta.nome}</div>
                      <Select
                        mode="multiple"
                        placeholder="Selecione uma ou mais medidas de controle"
                        value={medidasPorPergunta[String(pergunta.id)] || []}
                        onChange={(value) =>
                          setMedidasPorPergunta((current) => ({
                            ...current,
                            [String(pergunta.id)]: value.map(String),
                          }))
                        }
                        options={medidasControleOptions}
                        style={{ width: '100%' }}
                        allowClear
                        optionFilterProp="label"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : null}

        <Form.Item style={{ marginTop: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading || loadingSources}
            disabled={loadingSources}
          >
            Salvar grupo
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
