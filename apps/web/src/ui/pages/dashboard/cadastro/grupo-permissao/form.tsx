'use client';

import {
  buildPermissionCatalogGroups,
  type PermissionCatalogGroup,
} from '@/lib/authz/user-permission-admin';
import type { Permission } from '@/lib/types/permissions';
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useEffect } from 'react';

const { Text } = Typography;
const permissionGroups: PermissionCatalogGroup[] = buildPermissionCatalogGroups();

export interface PermissionProfileFormData {
  key?: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissions: Permission[];
}

interface PermissionProfileFormProps {
  initialValues?: Partial<PermissionProfileFormData>;
  onSubmit: (values: PermissionProfileFormData) => Promise<void>;
  loading?: boolean;
}

function toProfileKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PermissionProfileForm({
  initialValues,
  onSubmit,
  loading = false,
}: PermissionProfileFormProps) {
  const [form] = Form.useForm<PermissionProfileFormData>();

  useEffect(() => {
    form.setFieldsValue({
      key: initialValues?.key ?? '',
      nome: initialValues?.nome ?? '',
      descricao: initialValues?.descricao ?? '',
      ativo: initialValues?.ativo ?? true,
      permissions: initialValues?.permissions ?? [],
    });
  }, [form, initialValues]);

  return (
    <Form<PermissionProfileFormData>
      form={form}
      layout='vertical'
      onFinish={async (values) => {
        const normalizedKey =
          values.key?.trim() || toProfileKey(values.nome || '');

        await onSubmit({
          ...values,
          key: normalizedKey,
          descricao: values.descricao?.trim() || '',
          permissions: [...new Set(values.permissions ?? [])],
        });
      }}
      initialValues={{
        ativo: true,
        permissions: [],
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Nome do grupo'
            name='nome'
            rules={[{ required: true, message: 'Informe o nome do grupo.' }]}
          >
            <Input placeholder='Ex.: Planejamento' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label='Chave interna'
            name='key'
            extra='Opcional. Se ficar em branco, será gerada automaticamente a partir do nome ao salvar.'
          >
            <Input placeholder='Ex.: planejamento' />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label='Descrição' name='descricao'>
        <Input.TextArea
          rows={3}
          placeholder='Resumo opcional do perfil e do público esperado.'
        />
      </Form.Item>

      <Form.Item
        label='Grupo ativo'
        name='ativo'
        valuePropName='checked'
        extra='Grupos inativos não aparecem para nova atribuição, mas podem continuar vinculados até revisão.'
      >
        <Switch />
      </Form.Item>

      <Divider orientation='left'>Permissões padrão do grupo</Divider>

      <Form.Item
        name='permissions'
        rules={[
          {
            required: true,
            type: 'array',
            min: 1,
            message: 'Selecione ao menos uma permissão.',
          },
        ]}
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            {permissionGroups.map((group) => (
              <div key={group.key}>
                <Divider orientation='left' style={{ marginTop: 0 }}>
                  {group.label}
                </Divider>
                <Row gutter={[16, 12]}>
                  {group.permissions.map((item) => (
                    <Col span={12} key={item.permission}>
                      <Checkbox value={item.permission}>
                        <Space direction='vertical' size={0}>
                          <Text>{item.label}</Text>
                          <Text type='secondary' style={{ fontSize: 12 }}>
                            {item.description}
                          </Text>
                          <Text type='secondary' style={{ fontSize: 12 }}>
                            {item.permission}
                          </Text>
                        </Space>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Space>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button type='primary' htmlType='submit' loading={loading}>
            Salvar grupo
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
