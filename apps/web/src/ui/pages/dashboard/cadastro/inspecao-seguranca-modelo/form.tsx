'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Form, Input, List, Select, Space, Spin, Transfer, Typography } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';
import { getInspecaoSegurancaModelo } from '@/lib/actions/inspecaoSegurancaModelo/get';
import { listInspecaoSegurancaGruposPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/list';
import { listInspecaoSegurancaTipos } from '@/lib/actions/inspecaoSegurancaTipo/list';
import type { InspecaoSegurancaGrupoPergunta, InspecaoSegurancaTipo } from '@nexa-oper/db';

export interface InspecaoSegurancaModeloFormData {
  nome: string;
  descricao?: string | null;
  tipoId: number;
  grupoPerguntaIds: number[];
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: InspecaoSegurancaModeloFormData) => void;
  initialValues?: Partial<InspecaoSegurancaModeloFormData & { id: number }>;
  loading?: boolean;
}

interface ModeloGrupoRelacao {
  grupoPerguntaId: number;
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

export default function InspecaoSegurancaModeloForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<InspecaoSegurancaModeloFormData>();
  const [tipos, setTipos] = useState<InspecaoSegurancaTipo[]>([]);
  const [grupos, setGrupos] = useState<InspecaoSegurancaGrupoPergunta[]>([]);
  const [targetGrupos, setTargetGrupos] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const grupoItems = useMemo<TransferItem[]>(
    () => grupos.map(item => ({ key: String(item.id), title: item.nome })),
    [grupos]
  );
  const gruposById = useMemo(() => new Map(grupos.map(item => [String(item.id), item])), [grupos]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [tiposRes, gruposRes] = await Promise.all([
          listInspecaoSegurancaTipos({ page: 1, pageSize: 500, orderBy: 'nome', orderDir: 'asc' }),
          listInspecaoSegurancaGruposPergunta({ page: 1, pageSize: 500, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setTipos(tiposRes.data?.data || []);
        setGrupos(gruposRes.data?.data || []);
      } catch {
        message.error('Erro ao carregar tipos e grupos');
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
        setTargetGrupos([]);
        return;
      }

      form.setFieldsValue({
        nome: initialValues.nome,
        descricao: initialValues.descricao,
        tipoId: initialValues.tipoId,
        ativo: initialValues.ativo ?? true,
      });

      if (!initialValues.id) {
        setTargetGrupos((initialValues.grupoPerguntaIds || []).map(String));
        return;
      }

      const res = await getInspecaoSegurancaModelo({ id: initialValues.id });
      const data = res.data as { gruposRelacao?: ModeloGrupoRelacao[] } | undefined;
      setTargetGrupos(
        [...(data?.gruposRelacao || [])]
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.id ?? 0) - (b.id ?? 0))
          .map(item => String(item.grupoPerguntaId))
      );
    };
    applyInitial();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout='vertical'
        onFinish={values =>
          onSubmit({
            ...values,
            grupoPerguntaIds: targetGrupos.map(Number),
          })
        }
      >
        <Form.Item name='nome' label='Modelo de Inspeção' rules={[{ required: true }]}>
          <Input autoFocus maxLength={255} showCount />
        </Form.Item>

        <Form.Item name='tipoId' label='Tipo de Inspeção' rules={[{ required: true }]}>
          <Select
            showSearch
            loading={loadingSources}
            optionFilterProp='label'
            options={tipos.map(tipo => ({
              value: tipo.id,
              label: `${tipo.nome} (${tipo.contexto})`,
            }))}
          />
        </Form.Item>

        <Form.Item name='descricao' label='Descrição'>
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>

        <Card size='small' title='Grupos de Perguntas' loading={loadingSources}>
          <Transfer
            dataSource={grupoItems}
            targetKeys={targetGrupos}
            onChange={next => setTargetGrupos(next.map(String))}
            render={item => item.title as string}
            titles={['Disponíveis', 'Selecionados']}
            listStyle={{ width: '48%', height: 300 }}
            showSearch
          />

          <Card size='small' title='Ordem no formulário mobile' style={{ marginTop: 12 }}>
            {targetGrupos.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Nenhum grupo selecionado' />
            ) : (
              <List
                size='small'
                dataSource={targetGrupos}
                renderItem={(id, index) => (
                  <List.Item
                    actions={[
                      <Button key='up' type='text' icon={<UpOutlined />} disabled={index === 0} onClick={() => setTargetGrupos(current => moveItem(current, index, -1))} />,
                      <Button key='down' type='text' icon={<DownOutlined />} disabled={index === targetGrupos.length - 1} onClick={() => setTargetGrupos(current => moveItem(current, index, 1))} />,
                    ]}
                  >
                    <Space>
                      <Typography.Text type='secondary'>{index + 1}</Typography.Text>
                      <Typography.Text>{gruposById.get(id)?.nome ?? `Grupo #${id}`}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Card>

        <Button type='primary' htmlType='submit' block loading={loading || loadingSources} style={{ marginTop: 16 }}>
          Salvar
        </Button>
      </Form>
    </Spin>
  );
}
