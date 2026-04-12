'use client';

import { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Input, Select, Upload, message, App, Switch, Tooltip } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';

export default function MobileAppVersionPageClient() {
  const { data: session } = useSession();
  const { message: msgApp } = App.useApp();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mobile-app-version`);
      if (!res.ok) throw new Error('Falha ao carregar versões');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      msgApp.error(err.message || 'Erro ao carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchVersions();
    }
  }, [session]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/mobile-app-version/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Falha ao apagar versão');
      msgApp.success('Versão deletada com sucesso!');
      fetchVersions();
    } catch (err: any) {
      msgApp.error(err.message);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const res = await fetch(`/api/mobile-app-version/${id}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Falha ao ativar versão');
      msgApp.success('Versão ativada com sucesso!');
      fetchVersions();
    } catch (err: any) {
      msgApp.error(err.message);
    }
  };

  const onFinish = async (values: any) => {
    const fileList = values.file;
    if (!fileList || fileList.length === 0) {
      return msgApp.error('Por favor, selecione um arquivo APK.');
    }
    
    const file = fileList[0].originFileObj;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('versao', values.versao);
    formData.append('plataforma', values.plataforma);
    if (values.notas) formData.append('notas', values.notas);
    if (values.ativo !== undefined) formData.append('ativo', values.ativo ? 'true' : 'false');

    setUploading(true);
    try {
      const res = await fetch(`/api/mobile-app-version`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao subir o arquivo');
      }

      msgApp.success('Versão cadastrada com sucesso!');
      setIsModalVisible(false);
      form.resetFields();
      fetchVersions();
    } catch (err: any) {
      msgApp.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Versão',
      dataIndex: 'versao',
      key: 'versao',
    },
    {
      title: 'Plataforma',
      dataIndex: 'plataforma',
      key: 'plataforma',
    },
    {
      title: 'Data Lançamento',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'URL Arquivo',
      key: 'arquivoUrl',
      render: (_: any, record: any) => (
        <a href={record.arquivoUrl} target="_blank" rel="noopener noreferrer">
          <DownloadOutlined /> Baixar
        </a>
      ),
    },
    {
      title: 'Ativa Promovida',
      key: 'ativo',
      render: (_: any, record: any) => (
        <Switch 
          checked={record.ativo} 
          onChange={() => handleActivate(record.id)} 
          checkedChildren="Ativa" 
          unCheckedChildren="inativa" 
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => (
        <Tooltip title="Excluir">
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Tooltip>
      ),
    },
  ];

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Versões do Mobile App (APK Dist)</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => { setIsModalVisible(true); form.resetFields(); }}
        >
          Nova Versão
        </Button>
      </div>

      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Cadastrar Nova Versão do App"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ plataforma: 'android', ativo: false }}>
          <Form.Item name="plataforma" label="Plataforma" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="android">Android (.apk)</Select.Option>
              <Select.Option value="ios">iOS (.ipa)</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="versao" label="Versão (Ex: 1.2.0)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="notas" label="Notas de Lançamento (opcional)">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="ativo" label="Ativar como oficial instantaneamente" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="file"
            label="Arquivo do App (.apk)"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: 'Selecione o arquivo!' }]}
          >
            <Upload 
              beforeUpload={() => false} // Impede upload automático do Ant Design, controlamos manualmente
              maxCount={1}
              accept=".apk,.ipa"
            >
              <Button icon={<UploadOutlined />}>Selecionar Arquivo</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={uploading} block>
              Salvar e Fazer Upload (pode demorar)
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
