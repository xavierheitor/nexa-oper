'use client';

import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Spin } from 'antd';
import { useEffect, useState } from 'react';

// Interface para dados do formulário
export interface UserFormData {
  nome: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Props do componente
interface UserFormProps {
  onSubmit: (values: UserFormData) => void;
  initialValues?: Partial<UserFormData>;
  loading?: boolean;
  isEditing?: boolean; // Mantido para compatibilidade, mas pode ser inferido de initialValues
}

export default function UserForm({
  onSubmit,
  initialValues,
  loading = false,
  isEditing: propIsEditing,
}: UserFormProps) {
  const [form] = Form.useForm();
  // Infere se está editando baseado em initialValues (se tem dados, está editando)
  const isEditing = propIsEditing ?? !!initialValues;
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  useEffect(() => {
    if (initialValues) {
      // Para edição, não incluir campos de senha
      const safeValues = { ...initialValues };
      delete safeValues.password;
      delete safeValues.confirmPassword;
      form.setFieldsValue(safeValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // Função para avaliar força da senha
  const evaluatePasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Deve ter pelo menos 8 caracteres');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Deve conter pelo menos 1 letra minúscula');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Deve conter pelo menos 1 letra maiúscula');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Deve conter pelo menos 1 número');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Deve conter pelo menos 1 caractere especial (@$!%*?&)');
    }

    return { score, feedback };
  };

  // Handler para mudança na senha
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    if (password) {
      setPasswordStrength(evaluatePasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  };

  // Cor do indicador de força da senha
  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return '#ff4d4f'; // Vermelho
    if (score <= 3) return '#faad14'; // Amarelo
    if (score <= 4) return '#52c41a'; // Verde claro
    return '#389e0d'; // Verde escuro
  };

  // Texto do indicador de força da senha
  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Fraca';
    if (score <= 3) return 'Média';
    if (score <= 4) return 'Forte';
    return 'Muito Forte';
  };

  return (
    <Spin spinning={loading}>
      <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      autoComplete="off"
    >
      {/* Informações Pessoais */}
      <Divider orientation="left">Informações Pessoais</Divider>

      {/* Nome */}
      <Form.Item
        name="nome"
        label="Nome Completo"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 2, max: 255, message: 'Nome deve ter entre 2 e 255 caracteres' },
          { pattern: /^[a-zA-ZÀ-ÿ\s]+$/, message: 'Nome deve conter apenas letras e espaços' }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Ex: João Silva Santos"
          autoFocus
          size="large"
        />
      </Form.Item>

      {/* Email */}
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Email é obrigatório' },
          { type: 'email', message: 'Formato de email inválido' },
          { max: 255, message: 'Email deve ter no máximo 255 caracteres' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="joao@example.com"
          size="large"
          type="email"
          autoComplete="email"
        />
      </Form.Item>

      {/* Username */}
      <Form.Item
        name="username"
        label="Nome de Usuário"
        rules={[
          { required: true, message: 'Username é obrigatório' },
          { min: 3, max: 255, message: 'Username deve ter entre 3 e 255 caracteres' },
          {
            pattern: /^[a-zA-Z0-9_.-]+$/,
            message: 'Username deve conter apenas letras, números, pontos, hífens e underscores'
          }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="joao.silva"
          size="large"
          autoComplete="username"
        />
      </Form.Item>

      {/* Seção de Senhas */}
      <Divider orientation="left">
        {isEditing ? 'Alterar Senha (Opcional)' : 'Senha de Acesso'}
      </Divider>

      {isEditing && (
        <Alert
          message="Deixe os campos de senha em branco se não quiser alterá-la"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Senha */}
      <Form.Item
        name="password"
        label="Senha"
        rules={[
          {
            required: !isEditing,
            message: 'Senha é obrigatória'
          },
          {
            min: 8,
            message: 'Senha deve ter no mínimo 8 caracteres'
          },
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            message: 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
          }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Digite sua senha"
          size="large"
          autoComplete="new-password"
          onChange={handlePasswordChange}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      {/* Indicador de força da senha */}
      {passwordStrength.score > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ marginRight: 8 }}>Força da senha:</span>
            <span
              style={{
                color: getPasswordStrengthColor(passwordStrength.score),
                fontWeight: 'bold'
              }}
            >
              {getPasswordStrengthText(passwordStrength.score)}
            </span>
          </div>
          <div
            style={{
              height: 4,
              backgroundColor: '#f0f0f0',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(passwordStrength.score / 5) * 100}%`,
                backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          {passwordStrength.feedback.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              {passwordStrength.feedback.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmação de Senha */}
      <Form.Item
        name="confirmPassword"
        label="Confirmar Senha"
        dependencies={['password']}
        rules={[
          {
            required: !isEditing,
            message: 'Confirmação de senha é obrigatória'
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              const password = getFieldValue('password');

              // Se estamos editando e nenhuma senha foi digitada, ok
              if (isEditing && !password && !value) {
                return Promise.resolve();
              }

              // Se uma senha foi digitada, a confirmação deve coincidir
              if (!value || password === value) {
                return Promise.resolve();
              }

              return Promise.reject(new Error('As senhas não coincidem'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirme sua senha"
          size="large"
          autoComplete="new-password"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      {/* Botão Submit */}
      <Form.Item style={{ marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={loading}
        >
          {isEditing ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </Form.Item>
    </Form>
    </Spin>
  );
}
