'use client';

import { Form, Input, Switch, Button, Space } from 'antd';
import { useEffect } from 'react';

export interface TipoJustificativaFormData {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  geraFalta?: boolean;
}

interface TipoJustificativaFormProps {
  onSubmit: (values: TipoJustificativaFormData) => Promise<void>;
  initialValues?: Partial<TipoJustificativaFormData>;
  loading?: boolean;
}

export default function TipoJustificativaForm({
  onSubmit,
  initialValues,
  loading = false,
}: TipoJustificativaFormProps) {
  const [form] = Form.useForm<TipoJustificativaFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ativo: true,
        geraFalta: true,
        ...initialValues,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        ativo: true,
        geraFalta: true,
      });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        ativo: true,
        geraFalta: true,
        ...initialValues,
      }}
    >
      <Form.Item
        name="nome"
        label="Nome"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { max: 255, message: 'Nome deve ter no máximo 255 caracteres' },
        ]}
      >
        <Input placeholder="Ex: Atestado Médico, Falta de Reposição" autoFocus />
      </Form.Item>

      <Form.Item
        name="descricao"
        label="Descrição"
        rules={[{ max: 1000, message: 'Descrição deve ter no máximo 1000 caracteres' }]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Descreva o tipo de justificativa (opcional)"
        />
      </Form.Item>

      <Form.Item
        name="geraFalta"
        label="Gera Falta"
        valuePropName="checked"
        tooltip="Se marcado, a justificativa ainda gera falta. Se desmarcado, conta como dia trabalhado."
      >
        <Switch checkedChildren="Sim" unCheckedChildren="Não" />
      </Form.Item>

      <Form.Item
        name="ativo"
        label="Ativo"
        valuePropName="checked"
      >
        <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => form.resetFields()}>Limpar</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

