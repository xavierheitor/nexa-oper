'use client';

import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { TipoAtividade } from '@nexa-oper/db';
import { App, Button, Form, Input, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';

export interface SubtipoAtividadeFormData {
  nome: string;
  atividadeTipoId: number;
}

interface Props {
  onSubmit: (values: SubtipoAtividadeFormData) => void;
  initialValues?: Partial<SubtipoAtividadeFormData>;
  loading?: boolean;
}

export default function SubtipoAtividadeForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<SubtipoAtividadeFormData>();
  const [tiposAtividade, setTiposAtividade] = useState<TipoAtividade[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  useEffect(() => {
    const loadTiposAtividade = async () => {
      try {
        setLoadingSelects(true);
        const response = await listTiposAtividade({
          page: 1,
          pageSize: 1000,
          orderBy: 'nome',
          orderDir: 'asc',
        });
        setTiposAtividade(response.data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar tipos de atividade:', error);
        message.error('Erro ao carregar tipos de atividade');
      } finally {
        setLoadingSelects(false);
      }
    };

    loadTiposAtividade();
  }, [message]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item
          name='nome'
          label='Subtipo de Atividade'
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input autoFocus placeholder='Digite o nome do subtipo' maxLength={255} />
        </Form.Item>

        <Form.Item
          name='atividadeTipoId'
          label='Tipo de Atividade'
          rules={[{ required: true, message: 'Tipo de atividade é obrigatório' }]}
        >
          <Select
            placeholder='Selecione o tipo de atividade'
            loading={loadingSelects}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={tiposAtividade.map((tipo) => ({
              value: tipo.id,
              label: tipo.nome,
            }))}
          />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading || loadingSelects}>
            Salvar
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
