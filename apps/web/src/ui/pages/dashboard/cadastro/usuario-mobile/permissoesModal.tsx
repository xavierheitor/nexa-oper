'use client';

import { Form, Select, Button, Spin, Card, Table, App } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { listContratos } from '@/lib/actions/contrato/list';
import { setMobileContratoPermissao } from '@/lib/actions/mobileContratoPermissao/setPermissao';
import { listMobileContratoPermissoes } from '@/lib/actions/mobileContratoPermissao/listPermissoes';
import { deleteMobileContratoPermissao } from '@/lib/actions/mobileContratoPermissao/deletePermissao';
import { MobileContratoPermissao } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface PermissoesModalProps {
  mobileUserId: number;
  mobileUserName: string;
  onSaved: () => void;
  controllerExec: CrudController<unknown>['exec'];
}

export default function PermissoesModal({
  mobileUserId,
  mobileUserName,
  onSaved,
  controllerExec
}: PermissoesModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Carregar contratos e permissões
  const { data: contratosData, loading: loadingContratos, refetch: refetchContratos } = useDataFetch(
    async () => {
      const [contratosResult, permissoesResult] = await Promise.all([
        listContratos({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        listMobileContratoPermissoes({ mobileUserId, page: 1, pageSize: 200 })
      ]);

      if (contratosResult.success && contratosResult.data && permissoesResult.success && permissoesResult.data) {
        return {
          contratos: contratosResult.data.data || [],
          permissoes: permissoesResult.data.data || [],
        };
      }
      throw new Error('Erro ao carregar dados');
    },
    [mobileUserId],
    {
      onError: () => {
        message.error('Erro ao carregar dados');
      }
    }
  );

  const contratos = contratosData?.contratos || [];
  const permissoes = contratosData?.permissoes || [];
  const loading = loadingContratos;

  const handleSubmit = (values: { contratoId: number }) => {
    controllerExec(
      () => setMobileContratoPermissao({
        mobileUserId,
        contratoId: values.contratoId
      }),
      'Permissão adicionada com sucesso!'
    ).then(() => {
      form.resetFields();
      refetchContratos();
      onSaved();
    });
  };

  const handleDelete = (permissaoId: number) => {
    controllerExec(
      () => deleteMobileContratoPermissao({ id: permissaoId }),
      'Permissão removida com sucesso!'
    ).then(() => {
      refetchContratos();
      onSaved();
    });
  };

  const columns = [
    {
      title: 'Contrato',
      dataIndex: ['contrato', 'nome'],
      key: 'contrato',
    },
    {
      title: 'Número',
      dataIndex: ['contrato', 'numero'],
      key: 'numero',
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: unknown, record: MobileContratoPermissao) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          Remover
        </Button>
      ),
    },
  ];

  // Filtra contratos já vinculados
  const contratosDisponiveis = contratos.filter(
    contrato => !permissoes.some(p => p.contratoId === contrato.id)
  );

  return (
    <Spin spinning={loading} style={{ display: 'block', minHeight: '200px' }}>
      <div>
        <Card title={`Adicionar Permissão - ${mobileUserName}`} style={{ marginBottom: 16 }}>
          <Form
            form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="contratoId"
            label="Contrato"
            rules={[{ required: true, message: 'Selecione um contrato' }]}
          >
            <Select
              showSearch
              placeholder="Selecione um contrato"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contratosDisponiveis.map(c => ({
                value: c.id,
                label: `${c.nome} (${c.numero})`
              }))}
              disabled={contratosDisponiveis.length === 0}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={contratosDisponiveis.length === 0}
            >
              {contratosDisponiveis.length === 0 ? 'Todos os contratos já estão vinculados' : 'Adicionar Permissão'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Permissões Atuais">
        {permissoes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Nenhuma permissão encontrada
          </p>
        ) : (
          <Table
            columns={columns}
            dataSource={permissoes}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>
    </div>
    </Spin>
  );
}
