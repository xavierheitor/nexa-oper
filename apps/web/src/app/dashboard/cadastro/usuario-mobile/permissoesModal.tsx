'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, Button, Spin, message, Card, Table, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { listContratos } from '@/lib/actions/contrato/list';
import { setMobileContratoPermissao } from '@/lib/actions/mobileContratoPermissao/setPermissao';
import { listMobileContratoPermissoes } from '@/lib/actions/mobileContratoPermissao/listPermissoes';
import { deleteMobileContratoPermissao } from '@/lib/actions/mobileContratoPermissao/deletePermissao';

interface PermissoesModalProps {
  mobileUserId: number;
  mobileUserName: string;
  onSaved: () => void;
  controllerExec: any;
}

export default function PermissoesModal({
  mobileUserId,
  mobileUserName,
  onSaved,
  controllerExec
}: PermissoesModalProps) {
  const [form] = Form.useForm();
  const [contratos, setContratos] = useState<any[]>([]);
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [contratosResult, permissoesResult] = await Promise.all([
        listContratos({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        listMobileContratoPermissoes({ mobileUserId, page: 1, pageSize: 200 })
      ]);

      setContratos(contratosResult.data?.data || []);
      setPermissoes(permissoesResult.data?.data || []);
    } catch (e) {
      message.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [mobileUserId]);

  useEffect(() => {
    loadData();
  }, [mobileUserId, loadData]);

  const handleSubmit = (values: any) => {
    controllerExec(
      () => setMobileContratoPermissao({
        mobileUserId,
        contratoId: values.contratoId
      }),
      'Permissão adicionada com sucesso!'
    ).then(() => {
      form.resetFields();
      loadData();
      onSaved();
    });
  };

  const handleDelete = (permissaoId: number) => {
    controllerExec(
      () => deleteMobileContratoPermissao({ id: permissaoId }),
      'Permissão removida com sucesso!'
    ).then(() => {
      loadData();
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
      render: (_: any, record: any) => (
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

  if (loading) return <Spin spinning style={{ display: 'block', textAlign: 'center', padding: '20px' }} />;

  // Filtra contratos já vinculados
  const contratosDisponiveis = contratos.filter(
    contrato => !permissoes.some(p => p.contratoId === contrato.id)
  );

  return (
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
  );
}
