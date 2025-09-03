'use client';

import { cadastrarUsuario } from '@/lib/actions/common/cadastrarUsuario';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';

const { Title } = Typography;

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('username', values.username);
    formData.append('email', values.email);
    formData.append('password', values.password);
    formData.append('name', values.name);

    const result = await cadastrarUsuario(formData);

    setLoading(false);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
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
        <Form layout='vertical' onFinish={onFinish}>
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
