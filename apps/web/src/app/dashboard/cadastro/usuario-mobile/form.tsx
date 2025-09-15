'use client';

import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Spin } from 'antd';
import { useEffect, useState } from 'react';

// Interface para dados do formulário
export interface MobileUserFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

// Props do componente
interface MobileUserFormProps {
  onSubmit: (values: MobileUserFormData) => void;
  initialValues?: Partial<MobileUserFormData>;
  loading?: boolean;
  isEditing?: boolean;
}

export default function MobileUserForm({
  onSubmit,
  initialValues,
  loading = false,
  isEditing = false,
}: MobileUserFormProps) {
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  useEffect(() => {
    if (initialValues) {
      // Para edição, não incluir campos de senha
      const { password, confirmPassword, ...safeValues } = initialValues;
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

  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      autoComplete="off"
    >
      {/* Informações de Acesso */}
      <Divider orientation="left">Informações de Acesso Móvel</Divider>

      {/* Username */}
      <Form.Item
        name="username"
        label="Nome de Usuário Móvel"
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
          placeholder="Ex: usuario.mobile"
          autoFocus
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
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            message: 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
          }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Digite a senha"
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
          placeholder="Confirme a senha"
          size="large"
          autoComplete="new-password"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      {/* Informação sobre uso móvel */}
      <Alert
        message="Este usuário será utilizado para acesso via aplicativo móvel"
        description="Certifique-se de que o username seja fácil de lembrar e a senha seja segura, pois será usada para autenticação no dispositivo móvel."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Botão Submit */}
      <Form.Item style={{ marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={loading}
        >
          {isEditing ? 'Atualizar Usuário Móvel' : 'Criar Usuário Móvel'}
        </Button>
      </Form.Item>
    </Form>
  );
}
