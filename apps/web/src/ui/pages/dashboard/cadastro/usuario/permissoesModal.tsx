'use client';

import { App, Button, Card, Checkbox, Col, Divider, Row, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getUserPermissionSummary } from '@/lib/actions/userPermission/get';
import { updateUserPermissionGrants } from '@/lib/actions/userPermission/update';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import type { CrudController } from '@/lib/hooks/useCrudController';
import type { Permission } from '@/lib/types/permissions';
import type { UserPermissionSummary } from '@/lib/authz/user-permission-admin';

const { Paragraph, Text } = Typography;

interface PermissoesModalProps {
  userId: number;
  userName: string;
  onSaved: () => void;
  controllerExec: CrudController<unknown>['exec'];
}

export default function PermissoesModal({
  userId,
  userName,
  onSaved,
  controllerExec,
}: PermissoesModalProps) {
  const { message } = App.useApp();
  const [selectedDirectPermissions, setSelectedDirectPermissions] = useState<
    Permission[]
  >([]);

  const { data, loading, refetch } = useDataFetch<UserPermissionSummary>(
    async () => {
      const result = await getUserPermissionSummary({ userId });

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Erro ao carregar permissões');
    },
    [userId],
    {
      onError: () => {
        message.error('Erro ao carregar permissões do usuário');
      },
    },
  );

  useEffect(() => {
    if (data) {
      setSelectedDirectPermissions(data.directPermissions);
    }
  }, [data]);

  const inheritedPermissions = new Set(data?.inheritedPermissions ?? []);

  const handlePermissionToggle = (
    permission: Permission,
    checked: boolean,
  ) => {
    setSelectedDirectPermissions((current) => {
      if (checked) {
        return current.includes(permission) ? current : [...current, permission];
      }

      return current.filter((item) => item !== permission);
    });
  };

  const handleSave = () => {
    controllerExec(
      () =>
        updateUserPermissionGrants({
          userId,
          permissions: selectedDirectPermissions,
        }),
      'Permissões atualizadas com sucesso!',
      () => {
        refetch();
        onSaved();
      },
    );
  };

  if (loading || !data) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 240,
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <Card title={`Permissões de ${userName}`}>
          <Paragraph style={{ marginBottom: 8 }}>
            <Text strong>Roles atuais:</Text>{' '}
            {data.roleNames.length > 0 ? (
              data.roleNames.map((role) => (
                <Tag color='blue' key={role}>
                  {role}
                </Tag>
              ))
            ) : (
              <Text type='secondary'>Nenhum role vinculado</Text>
            )}
          </Paragraph>

          <Paragraph style={{ marginBottom: 0 }}>
            <Text strong>Permissões efetivas:</Text>{' '}
            <Tag color='green'>{data.effectivePermissions.length}</Tag>
            <Text type='secondary'>
              Herdadas do role + grants salvos no banco.
            </Text>
          </Paragraph>
        </Card>

        <Card title='Permissões herdadas dos roles'>
          {data.inheritedPermissions.length === 0 ? (
            <Text type='secondary'>
              Este usuário não herda permissões diretamente dos roles atuais.
            </Text>
          ) : (
            <Space size={[8, 8]} wrap>
              {data.inheritedPermissions.map((permission) => (
                <Tag color='geekblue' key={permission}>
                  {permission}
                </Tag>
              ))}
            </Space>
          )}
        </Card>

        <Card
          title='Permissões extras liberadas no banco'
          extra={
            <Button type='primary' onClick={handleSave}>
              Salvar permissões
            </Button>
          }
        >
          <Paragraph type='secondary'>
            Marque apenas as permissões extras. Permissões já herdadas do role
            aparecem desabilitadas para evitar redundância no banco.
          </Paragraph>

          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            {data.catalog.map((group) => (
              <div key={group.key}>
                <Divider orientation='left' style={{ marginTop: 0 }}>
                  {group.label}
                </Divider>
                <Row gutter={[16, 12]}>
                  {group.permissions.map((item) => {
                    const inherited = inheritedPermissions.has(item.permission);
                    const checked =
                      inherited || selectedDirectPermissions.includes(item.permission);

                    return (
                      <Col span={12} key={item.permission}>
                        <Checkbox
                          checked={checked}
                          disabled={inherited}
                          onChange={(event) =>
                            handlePermissionToggle(
                              item.permission,
                              event.target.checked,
                            )
                          }
                        >
                          <Space direction='vertical' size={0}>
                            <Text>{item.label}</Text>
                            <Text type='secondary' style={{ fontSize: 12 }}>
                              {item.description}
                            </Text>
                            <Text type='secondary' style={{ fontSize: 12 }}>
                              {item.permission}
                              {inherited ? ' · herdada do role' : ''}
                            </Text>
                          </Space>
                        </Checkbox>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
          </Space>
        </Card>
      </Space>
    </Spin>
  );
}
