'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Form, Input, List, Select, Space, Spin, Transfer, Typography } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';
import { getInspecaoSegurancaGrupoPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/get';
import { listInspecaoSegurancaOpcoesResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/list';
import { listInspecaoSegurancaPerguntas } from '@/lib/actions/inspecaoSegurancaPergunta/list';
import type { InspecaoSegurancaOpcaoResposta, InspecaoSegurancaPergunta } from '@nexa-oper/db';

export interface InspecaoSegurancaGrupoPerguntaFormData {
  nome: string;
  tipoResposta: 'opcao' | 'checkbox' | 'texto' | 'numero';
  perguntaIds: number[];
  opcaoRespostaIds: number[];
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: InspecaoSegurancaGrupoPerguntaFormData) => void;
  initialValues?: Partial<InspecaoSegurancaGrupoPerguntaFormData & { id: number }>;
  loading?: boolean;
}

interface GrupoPerguntaRelacao {
  perguntaId: number;
  ordem?: number | null;
  id?: number;
}

interface GrupoOpcaoRelacao {
  opcaoRespostaId: number;
  ordem?: number | null;
  id?: number;
}

function moveItem(list: string[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export default function InspecaoSegurancaGrupoPerguntaForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<InspecaoSegurancaGrupoPerguntaFormData>();
  const [perguntas, setPerguntas] = useState<InspecaoSegurancaPergunta[]>([]);
  const [opcoes, setOpcoes] = useState<InspecaoSegurancaOpcaoResposta[]>([]);
  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const [targetOpcoes, setTargetOpcoes] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const tipoResposta = Form.useWatch('tipoResposta', form);

  const perguntaItems = useMemo<TransferItem[]>(
    () => perguntas.map(item => ({ key: String(item.id), title: item.nome })),
    [perguntas]
  );
  const opcaoItems = useMemo<TransferItem[]>(
    () =>
      opcoes.map(item => ({
        key: String(item.id),
        title: `${item.nome}${item.geraPendencia ? ' (gera pendência)' : ''}${item.exigeFoto ? ' (foto)' : ''}`,
      })),
    [opcoes]
  );
  const perguntasById = useMemo(() => new Map(perguntas.map(item => [String(item.id), item])), [perguntas]);
  const opcoesById = useMemo(() => new Map(opcoes.map(item => [String(item.id), item])), [opcoes]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [perguntasRes, opcoesRes] = await Promise.all([
          listInspecaoSegurancaPerguntas({ page: 1, pageSize: 500, orderBy: 'nome', orderDir: 'asc' }),
          listInspecaoSegurancaOpcoesResposta({ page: 1, pageSize: 500, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setPerguntas(perguntasRes.data?.data || []);
        setOpcoes(opcoesRes.data?.data || []);
      } catch {
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
        form.setFieldsValue({ tipoResposta: 'opcao', ativo: true });
        setTargetPerguntas([]);
        setTargetOpcoes([]);
        return;
      }

      form.setFieldsValue({
        nome: initialValues.nome,
        tipoResposta: initialValues.tipoResposta || 'opcao',
        ativo: initialValues.ativo ?? true,
      });

      if (!initialValues.id) {
        setTargetPerguntas((initialValues.perguntaIds || []).map(String));
        setTargetOpcoes((initialValues.opcaoRespostaIds || []).map(String));
        return;
      }

      const res = await getInspecaoSegurancaGrupoPergunta({ id: initialValues.id });
      const data = res.data as
        | {
            perguntasRelacao?: GrupoPerguntaRelacao[];
            opcoesRelacao?: GrupoOpcaoRelacao[];
          }
        | undefined;
      setTargetPerguntas(
        [...(data?.perguntasRelacao || [])]
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.id ?? 0) - (b.id ?? 0))
          .map(item => String(item.perguntaId))
      );
      setTargetOpcoes(
        [...(data?.opcoesRelacao || [])]
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.id ?? 0) - (b.id ?? 0))
          .map(item => String(item.opcaoRespostaId))
      );
    };
    applyInitial();
  }, [initialValues, form]);

  const usesOptions = tipoResposta === 'opcao' || tipoResposta === 'checkbox';

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout='vertical'
        onFinish={values =>
          onSubmit({
            ...values,
            perguntaIds: targetPerguntas.map(Number),
            opcaoRespostaIds: usesOptions ? targetOpcoes.map(Number) : [],
          })
        }
      >
        <Form.Item name='nome' label='Grupo de Perguntas' rules={[{ required: true }]}>
          <Input autoFocus maxLength={255} showCount />
        </Form.Item>

        <Form.Item name='tipoResposta' label='Tipo de Resposta' rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'opcao', label: 'Opção única' },
              { value: 'checkbox', label: 'Múltipla seleção' },
              { value: 'texto', label: 'Texto' },
              { value: 'numero', label: 'Número' },
            ]}
          />
        </Form.Item>

        <Card size='small' title='Perguntas' loading={loadingSources}>
          <Transfer
            dataSource={perguntaItems}
            targetKeys={targetPerguntas}
            onChange={next => setTargetPerguntas(next.map(String))}
            render={item => item.title as string}
            titles={['Disponíveis', 'Selecionadas']}
            listStyle={{ width: '48%', height: 260 }}
            showSearch
          />
          <OrderedList
            title='Ordem das perguntas'
            ids={targetPerguntas}
            labelFor={id => perguntasById.get(id)?.nome ?? `Pergunta #${id}`}
            onMove={(index, direction) => setTargetPerguntas(current => moveItem(current, index, direction))}
          />
        </Card>

        {usesOptions && (
          <Card size='small' title='Opções de Resposta' style={{ marginTop: 12 }} loading={loadingSources}>
            <Transfer
              dataSource={opcaoItems}
              targetKeys={targetOpcoes}
              onChange={next => setTargetOpcoes(next.map(String))}
              render={item => item.title as string}
              titles={['Disponíveis', 'Selecionadas']}
              listStyle={{ width: '48%', height: 260 }}
              showSearch
            />
            <OrderedList
              title='Ordem das opções'
              ids={targetOpcoes}
              labelFor={id => opcoesById.get(id)?.nome ?? `Opção #${id}`}
              onMove={(index, direction) => setTargetOpcoes(current => moveItem(current, index, direction))}
            />
          </Card>
        )}

        <Button type='primary' htmlType='submit' block loading={loading || loadingSources} style={{ marginTop: 16 }}>
          Salvar
        </Button>
      </Form>
    </Spin>
  );
}

function OrderedList({
  title,
  ids,
  labelFor,
  onMove,
}: {
  title: string;
  ids: string[];
  labelFor: (id: string) => string;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <Card size='small' title={title} style={{ marginTop: 12 }}>
      {ids.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Nenhum item selecionado' />
      ) : (
        <List
          size='small'
          dataSource={ids}
          renderItem={(id, index) => (
            <List.Item
              actions={[
                <Button key='up' type='text' icon={<UpOutlined />} disabled={index === 0} onClick={() => onMove(index, -1)} />,
                <Button key='down' type='text' icon={<DownOutlined />} disabled={index === ids.length - 1} onClick={() => onMove(index, 1)} />,
              ]}
            >
              <Space>
                <Typography.Text type='secondary'>{index + 1}</Typography.Text>
                <Typography.Text>{labelFor(id)}</Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
