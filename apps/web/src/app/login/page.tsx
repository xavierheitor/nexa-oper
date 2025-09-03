'use client'

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input } from 'antd';
import Title from 'antd/es/typography/Title';


export default function LoginPage() {
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
          form={undefined}
          name='login Nexa Oper'
          initialValues={{ remember: true }}
          onFinish={undefined}
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
            help={undefined} // Mostra erro no campo se houver
            validateStatus={undefined}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Digite sua senha'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={false}>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>

    </div>
  )
}