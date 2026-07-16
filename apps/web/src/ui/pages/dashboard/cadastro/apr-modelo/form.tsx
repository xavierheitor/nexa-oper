'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Space,
  Spin,
  Transfer,
  Typography,
} from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

import { getApr } from '@/lib/actions/apr/get';
import { listAprGruposPergunta } from '@/lib/actions/aprGrupoPergunta/list';
import type { AprGrupoPergunta } from '@nexa-oper/db';

const { Title } = Typography;

export interface AprFormData {
  nome: string;
  grupoPerguntaIds: number[];
}

interface AprGrupoRelacaoForm {
  aprGrupoPerguntaId: number;
  ordem?: number | null;
  id?: number;
}

interface Props {
  onSubmit: (values: AprFormData) => void;
  initialValues?: Partial<AprFormData & { id: number }>;
  loading?: boolean;
}

export default function AprForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AprFormData>();

  const [grupos, setGrupos] = useState<AprGrupoPergunta[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [targetGrupos, setTargetGrupos] = useState<string[]>([]);

  const grupoItems = useMemo<TransferItem[]>(
    () => grupos.map(g => ({ key: String(g.id), title: g.nome })),
    [grupos]
  );

  const gruposPorId = useMemo(
    () => new Map(grupos.map(grupo => [String(grupo.id), grupo])),
    [grupos]
  );

  const moverGrupoSelecionado = (index: number, direction: -1 | 1) => {
    setTargetGrupos(current => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const gruposRes = await listAprGruposPergunta({
          page: 1,
          pageSize: 200,
          orderBy: 'nome',
          orderDir: 'asc',
        });
        setGrupos(gruposRes.data?.data || []);
      } catch (error) {
        console.error(error);
        message.error('Erro ao carregar grupos de perguntas');
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
        grupoPerguntaIds: initialValues.grupoPerguntaIds || [],
      });

      if (initialValues.id) {
        const res = await getApr({ id: initialValues.id });
        const data = res.data;
        if (data && 'AprGrupoRelacao' in data) {
          const aprGrupoRelacao =
            (data as { AprGrupoRelacao?: AprGrupoRelacaoForm[] })
              .AprGrupoRelacao || [];
          const gruposOrdenados = [...aprGrupoRelacao].sort((a, b) => {
            const ordem = (a.ordem ?? 0) - (b.ordem ?? 0);
            if (ordem !== 0) return ordem;
            return (a.id ?? 0) - (b.id ?? 0);
          });
          setTargetGrupos(
            gruposOrdenados.map(r => String(r.aprGrupoPerguntaId))
          );
        }
      } else {
        setTargetGrupos((initialValues.grupoPerguntaIds || []).map(String));
      }
    };

    applyInitial();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout='vertical'
        onFinish={vals =>
          onSubmit({
            nome: vals.nome,
            grupoPerguntaIds: targetGrupos.map(Number),
          })
        }
      >
        <Title level={5}>Dados da APR</Title>

        <Form.Item
          name='nome'
          label='Nome da APR'
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Nome deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input
            autoFocus
            placeholder='Digite o nome da APR'
            showCount
            maxLength={255}
          />
        </Form.Item>

        <Card
          size='small'
          title='Grupos de Perguntas'
          style={{ marginTop: 12 }}
          loading={loadingSources}
        >
          <Transfer
            dataSource={grupoItems}
            targetKeys={targetGrupos}
            onChange={nextTarget => setTargetGrupos(nextTarget.map(String))}
            render={item => item.title as string}
            listStyle={{ width: '48%', height: 300 }}
            titles={['Disponíveis', 'Selecionados']}
            showSearch
            filterOption={(inputValue, item) =>
              item.title!.toLowerCase().includes(inputValue.toLowerCase())
            }
            disabled={loadingSources}
          />

          <Card
            size='small'
            title='Ordem no formulário mobile'
            style={{ marginTop: 12 }}
          >
            {targetGrupos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description='Nenhum grupo selecionado'
              />
            ) : (
              <List
                size='small'
                dataSource={targetGrupos}
                renderItem={(grupoId, index) => {
                  const grupo = gruposPorId.get(grupoId);
                  return (
                    <List.Item
                      actions={[
                        <Button
                          key='up'
                          type='text'
                          icon={<UpOutlined />}
                          disabled={index === 0}
                          onClick={() => moverGrupoSelecionado(index, -1)}
                          aria-label='Mover grupo para cima'
                        />,
                        <Button
                          key='down'
                          type='text'
                          icon={<DownOutlined />}
                          disabled={index === targetGrupos.length - 1}
                          onClick={() => moverGrupoSelecionado(index, 1)}
                          aria-label='Mover grupo para baixo'
                        />,
                      ]}
                    >
                      <Space>
                        <Typography.Text type='secondary'>
                          {index + 1}
                        </Typography.Text>
                        <Typography.Text>
                          {grupo?.nome ?? `Grupo #${grupoId}`}
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Card>

        <Form.Item style={{ marginTop: 16 }}>
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={loading || loadingSources}
            disabled={loadingSources}
          >
            Salvar APR
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
