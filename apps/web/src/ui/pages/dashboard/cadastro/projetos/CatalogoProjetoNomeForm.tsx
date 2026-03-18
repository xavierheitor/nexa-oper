'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface CatalogoProjetoNomeFormData {
  nome: string;
}

interface CatalogoProjetoNomeFormProps {
  onSubmit: (values: CatalogoProjetoNomeFormData) => void;
  initialValues?: Partial<CatalogoProjetoNomeFormData>;
  loading?: boolean;
  label: string;
  placeholder: string;
}

export default function CatalogoProjetoNomeForm({
  onSubmit,
  initialValues,
  loading = false,
  label,
  placeholder,
}: CatalogoProjetoNomeFormProps) {
  const [form] = Form.useForm();

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
          label={label}
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input autoFocus placeholder={placeholder} />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            Salvar
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
