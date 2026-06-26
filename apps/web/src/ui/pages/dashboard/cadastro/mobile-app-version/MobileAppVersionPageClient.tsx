'use client';

import { useState, useEffect } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Tooltip,
  Upload,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';

type MobileAppVersionRow = {
  id: number;
  versao: string;
  build: number;
  plataforma: string;
  notas?: string | null;
  arquivoUrl: string;
  apkSizeBytes?: number | null;
  sha256?: string | null;
  ativo: boolean;
  wipeRequired: boolean;
  minSupportedBuild?: number | null;
  minLoginBuild?: number | null;
  minOpenTurnoBuild?: number | null;
  minUploadBuild?: number | null;
  createdAt: string;
};

const appendOptionalNumber = (
  formData: FormData,
  key: string,
  value: number | null | undefined
) => {
  if (typeof value === 'number') {
    formData.append(key, String(value));
  }
};

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '-';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MobileAppVersionPageClient() {
  const { data: session } = useSession();
  const { message: msgApp } = App.useApp();

  const [data, setData] = useState<MobileAppVersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

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
    formData.append('build', String(values.build));
    formData.append('plataforma', values.plataforma);
    if (values.notas) formData.append('notas', values.notas);
    if (values.ativo !== undefined)
      formData.append('ativo', values.ativo ? 'true' : 'false');
    if (values.wipeRequired !== undefined)
      formData.append('wipeRequired', values.wipeRequired ? 'true' : 'false');
    appendOptionalNumber(
      formData,
      'minSupportedBuild',
      values.minSupportedBuild
    );
    appendOptionalNumber(formData, 'minLoginBuild', values.minLoginBuild);
    appendOptionalNumber(
      formData,
      'minOpenTurnoBuild',
      values.minOpenTurnoBuild
    );
    appendOptionalNumber(formData, 'minUploadBuild', values.minUploadBuild);

    setUploading(true);
    try {
      const res = await fetch(`/api/mobile-app-version`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (res.status === 413) {
          throw new Error(
            'Arquivo muito grande. O servidor (Nginx) precisa permitir uploads de APK — veja docs/07-deploy-producao-pm2.md (client_max_body_size 250m).'
          );
        }
        if (contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || 'Erro ao subir o arquivo'
          );
        }
        throw new Error(`Erro ao subir o arquivo (HTTP ${res.status})`);
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
      title: 'Build',
      dataIndex: 'build',
      key: 'build',
      sorter: (a: MobileAppVersionRow, b: MobileAppVersionRow) =>
        a.build - b.build,
    },
    {
      title: 'Plataforma',
      dataIndex: 'plataforma',
      key: 'plataforma',
      render: (value: string) => value.toUpperCase(),
    },
    {
      title: 'Política',
      key: 'policy',
      render: (_: unknown, record: MobileAppVersionRow) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Geral: {record.minSupportedBuild ?? '-'}</span>
          <span>Login: {record.minLoginBuild ?? '-'}</span>
          <span>Abertura: {record.minOpenTurnoBuild ?? '-'}</span>
          <span>Upload: {record.minUploadBuild ?? '-'}</span>
        </div>
      ),
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
      render: (_: unknown, record: MobileAppVersionRow) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href={record.arquivoUrl} target='_blank' rel='noopener noreferrer'>
            <DownloadOutlined /> Baixar
          </a>
          <small>{formatSize(record.apkSizeBytes)}</small>
          {record.sha256 ? (
            <small>SHA: {record.sha256.slice(0, 12)}...</small>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Ativa Promovida',
      key: 'ativo',
      render: (_: unknown, record: MobileAppVersionRow) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Switch
            checked={record.ativo}
            onChange={() => handleActivate(record.id)}
            checkedChildren='Ativa'
            unCheckedChildren='inativa'
          />
          {record.wipeRequired ? <Tag color='orange'>wipe</Tag> : null}
        </div>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: unknown, record: MobileAppVersionRow) => (
        <Tooltip title='Excluir'>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2>Versões do Mobile App (APK Dist)</h2>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => {
            setIsModalVisible(true);
            form.resetFields();
          }}
        >
          Nova Versão
        </Button>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey='id'
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title='Cadastrar Nova Versão do App'
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            plataforma: 'android',
            ativo: false,
            wipeRequired: false,
          }}
        >
          <Form.Item
            name='plataforma'
            label='Plataforma'
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value='android'>Android (.apk)</Select.Option>
              <Select.Option value='ios'>iOS (.ipa)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='versao'
            label='Versão (Ex: 1.2.0)'
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name='build'
            label='Build incremental'
            rules={[{ required: true, message: 'Informe o número de build' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name='notas' label='Notas de Lançamento (opcional)'>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name='ativo'
            label='Ativar como oficial instantaneamente'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name='wipeRequired'
            label='Executar wipe local após instalar esta versão'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name='minSupportedBuild'
            label='Build mínimo suportado (geral)'
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name='minLoginBuild' label='Build mínimo para login'>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name='minOpenTurnoBuild'
            label='Build mínimo para abertura de turno'
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name='minUploadBuild' label='Build mínimo para uploads'>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name='file'
            label='Arquivo do App (.apk)'
            valuePropName='fileList'
            getValueFromEvent={normFile}
            rules={[{ required: true, message: 'Selecione o arquivo!' }]}
          >
            <Upload
              beforeUpload={() => false} // Impede upload automático do Ant Design, controlamos manualmente
              maxCount={1}
              accept='.apk,.ipa'
            >
              <Button icon={<UploadOutlined />}>Selecionar Arquivo</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={uploading} block>
              Salvar e Fazer Upload (pode demorar)
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
