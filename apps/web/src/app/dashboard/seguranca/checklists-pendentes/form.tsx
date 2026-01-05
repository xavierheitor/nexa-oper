'use client';

import { ChecklistPendencia, StatusPendencia } from '@nexa-oper/db';
import { Button, Form, Input, Select, Space, Typography, Image, Descriptions, Tag } from 'antd';

const { TextArea } = Input;
const { Title } = Typography;

interface Props {
  initialValues: ChecklistPendencia & {
    checklistResposta?: {
      pergunta?: { nome?: string };
      opcaoResposta?: { nome?: string };
    };
    checklistPreenchido?: {
      checklist?: { nome?: string };
      eletricista?: { nome?: string };
    };
    turno?: {
      equipe?: { nome?: string };
    };
    ChecklistRespostaFoto?: Array<{ urlPublica?: string; caminhoArquivo?: string }>;
  };
  onSubmit: (values: {
    id: number;
    status: StatusPendencia;
    observacaoTratamento?: string;
  }) => void;
  loading?: boolean;
}

export default function ChecklistPendenciaForm({ initialValues, onSubmit, loading = false }: Props) {
  const [form] = Form.useForm();

  const getStatusColor = (status: StatusPendencia) => {
    switch (status) {
      case 'AGUARDANDO_TRATAMENTO':
        return 'red';
      case 'EM_TRATAMENTO':
        return 'orange';
      case 'TRATADA':
        return 'green';
      case 'REGISTRO_INCORRETO':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: StatusPendencia) => {
    switch (status) {
      case 'AGUARDANDO_TRATAMENTO':
        return 'Aguardando Tratamento';
      case 'EM_TRATAMENTO':
        return 'Em Tratamento';
      case 'TRATADA':
        return 'Tratada';
      case 'REGISTRO_INCORRETO':
        return 'Registro Incorreto';
      default:
        return status;
    }
  };

  interface FormValues {
    status: StatusPendencia;
    observacaoTratamento?: string;
  }

  const handleFinish = (values: FormValues) => {
    onSubmit({
      id: initialValues.id,
      status: values.status,
      observacaoTratamento: values.observacaoTratamento,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: initialValues.status,
        observacaoTratamento: initialValues.observacaoTratamento,
      }}
      onFinish={handleFinish}
    >
      <Descriptions title="Informações da Pendência" bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="ID">{initialValues.id}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(initialValues.status)}>{getStatusLabel(initialValues.status)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Checklist">
          {initialValues.checklistPreenchido?.checklist?.nome || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Eletricista">
          {initialValues.checklistPreenchido?.eletricista?.nome || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Equipe">
          {initialValues.turno?.equipe?.nome || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Pergunta">
          {initialValues.checklistResposta?.pergunta?.nome || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Resposta">
          {initialValues.checklistResposta?.opcaoResposta?.nome || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Observação do Problema">
          {initialValues.observacaoProblema || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Criado em">
          {new Date(initialValues.createdAt).toLocaleString('pt-BR')}
        </Descriptions.Item>
        {initialValues.tratadoPor && (
          <Descriptions.Item label="Tratado por">
            {initialValues.tratadoPor}
          </Descriptions.Item>
        )}
        {initialValues.tratadoEm && (
          <Descriptions.Item label="Tratado em">
            {new Date(initialValues.tratadoEm).toLocaleString('pt-BR')}
          </Descriptions.Item>
        )}
      </Descriptions>

      {initialValues.ChecklistRespostaFoto && initialValues.ChecklistRespostaFoto.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Fotos</Title>
          <Space wrap>
            {initialValues.ChecklistRespostaFoto.map((foto, idx) => (
              <Image
                key={idx}
                width={150}
                height={150}
                src={foto.urlPublica || foto.caminhoArquivo || ''}
                alt={`Foto ${idx + 1}`}
                style={{ objectFit: 'cover' }}
              />
            ))}
          </Space>
        </div>
      )}

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Selecione o status' }]}
      >
        <Select placeholder="Selecione o status">
          <Select.Option value="AGUARDANDO_TRATAMENTO">Aguardando Tratamento</Select.Option>
          <Select.Option value="EM_TRATAMENTO">Em Tratamento</Select.Option>
          <Select.Option value="TRATADA">Tratada</Select.Option>
          <Select.Option value="REGISTRO_INCORRETO">Registro Incorreto</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="observacaoTratamento"
        label="Observação do Tratamento"
      >
        <TextArea
          rows={4}
          placeholder="Descreva o tratamento realizado ou observações adicionais"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
