'use client';

import { App, Button, Card, Form, Input, Select, Spin, Transfer } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

import { getAprGrupoPergunta } from '@/lib/actions/aprGrupoPergunta/get';
import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';
import type { AprOpcaoResposta, AprPergunta } from '@nexa-oper/db';

export interface AprGrupoPerguntaFormData {
  nome: string;
  tipoResposta: 'opcao' | 'checkbox' | 'texto';
  perguntaIds: number[];
  opcaoRespostaIds: number[];
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
  const [loadingSources, setLoadingSources] = useState(true);

  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const [targetOpcoes, setTargetOpcoes] = useState<string[]>([]);

  const tipoResposta = Form.useWatch('tipoResposta', form);

  const perguntaItems = useMemo<TransferItem[]>(
    () => perguntas.map((p) => ({ key: String(p.id), title: p.nome })),
    [perguntas]
  );

  const opcaoItems = useMemo<TransferItem[]>(
    () => opcoes.map((o) => ({ key: String(o.id), title: o.nome })),
    [opcoes]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [perguntasRes, opcoesRes] = await Promise.all([
          listAprPerguntas({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listAprOpcoesResposta({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);

        setPerguntas(perguntasRes.data?.data || []);
        setOpcoes(opcoesRes.data?.data || []);
      } catch (error) {
        console.error(error);
        message.error('Erro ao carregar perguntas e opções');
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
        return;
      }

      form.setFieldsValue({
        nome: initialValues.nome,
        tipoResposta: initialValues.tipoResposta || 'checkbox',
        perguntaIds: initialValues.perguntaIds || [],
        opcaoRespostaIds: initialValues.opcaoRespostaIds || [],
      });

      if (initialValues.id) {
        const res = await getAprGrupoPergunta({ id: initialValues.id });
        const data = res.data;

        if (
          data &&
          'AprGrupoPerguntaRelacao' in data &&
          'AprGrupoOpcaoRespostaRelacao' in data
        ) {
          const perguntaRelacoes =
            (data as { AprGrupoPerguntaRelacao?: Array<{ aprPerguntaId: number }> })
              .AprGrupoPerguntaRelacao || [];
          const opcaoRelacoes =
            (data as { AprGrupoOpcaoRespostaRelacao?: Array<{ aprOpcaoRespostaId: number }> })
              .AprGrupoOpcaoRespostaRelacao || [];

          setTargetPerguntas(perguntaRelacoes.map((item) => String(item.aprPerguntaId)));
          setTargetOpcoes(opcaoRelacoes.map((item) => String(item.aprOpcaoRespostaId)));
        }
      } else {
        setTargetPerguntas((initialValues.perguntaIds || []).map(String));
        setTargetOpcoes((initialValues.opcaoRespostaIds || []).map(String));
      }
    };

    applyInitial();
  }, [initialValues, form]);

  useEffect(() => {
    if (tipoResposta !== 'opcao') {
      setTargetOpcoes([]);
    }
  }, [tipoResposta]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(vals) =>
          onSubmit({
            nome: vals.nome,
            tipoResposta: vals.tipoResposta,
            perguntaIds: targetPerguntas.map(Number),
            opcaoRespostaIds: vals.tipoResposta === 'opcao' ? targetOpcoes.map(Number) : [],
          })
        }
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
