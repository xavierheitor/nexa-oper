'use client';

import { cadastrarUsuario } from '@/lib/actions/common/cadastrarUsuario';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';

const { Title } = Typography;

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<CadastroFormValues>();

  interface CadastroFormValues {
    username: string;
    email: string;
    password: string;
    name: string;
  }

  const onFinish = async (values: CadastroFormValues) => {
    setLoading(true);
    const result = await cadastrarUsuario(values);

    setLoading(false);
    if (result.success) {
      message.success('Usuário cadastrado com sucesso!');
      form.resetFields();
    } else {
      message.error(result.error ?? 'Erro ao cadastrar usuário.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          Cadastro
        </Title>
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item name='name' label='Nome' rules={[{ required: true }]}>
            <Input placeholder='Seu nome' />
          </Form.Item>
          <Form.Item name='username' label='Usuário' rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder='Escolha um usuário' />
          </Form.Item>
          <Form.Item name='email' label='Email'>
            <Input prefix={<MailOutlined />} placeholder='Digite seu email (opcional)' />
          </Form.Item>
          <Form.Item name='password' label='Senha' rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder='Crie uma senha' />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              Cadastrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
