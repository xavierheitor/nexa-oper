'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { errorHandler } from '@/lib/utils/errorHandler';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp(); // <-- 👈 Aqui puxa o contexto correto

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setFormError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username: values.username,
        password: values.password,
      });

      if (res?.ok) {
        message.success('Login realizado com sucesso!');
        router.push('/dashboard');
      } else {
        // Caso de erro conhecido (401 Unauthorized)
        setFormError('Usuário ou senha inválidos!');
      }
    } catch (err) {
      // Usa errorHandler padronizado
      errorHandler.log(err, 'LoginPage');
      message.error('Erro inesperado ao tentar fazer login. Tente novamente.');
    } finally {
      setLoading(false);
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
      <Card style={{ width: 350 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          Login
        </Title>
        <Form
          form={form}
          name='login'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout='vertical'
        >
          <Form.Item
            name='username'
            label='Usuário'
            rules={[{ required: true, message: 'Informe seu usuário!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='Digite seu usuário'
              autoComplete='username'
            />
          </Form.Item>

          <Form.Item
            name='password'
            label='Senha'
            rules={[{ required: true, message: 'Informe sua senha!' }]}
            help={formError} // Mostra erro no campo se houver
            validateStatus={formError ? 'error' : ''}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Digite sua senha'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
