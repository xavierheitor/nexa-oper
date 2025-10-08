/**
 * Formulário de Tipo de Escala
 *
 * Componente reutilizável para criação e edição de tipos de escala
 */

'use client';

import React from 'react';
import { Form, Input, Select, InputNumber, Switch, Button, Space, Alert } from 'antd';

interface TipoEscalaFormProps {
  initialValues?: {
    nome?: string;
    modoRepeticao?: 'CICLO_DIAS' | 'SEMANA_DEPENDENTE';
    cicloDias?: number;
    periodicidadeSemanas?: number;
    minEletricistasPorTurno?: number;
    ativo?: boolean;
    observacoes?: string;
  };
  onSubmit: (values: unknown) => Promise<void>;
  onCancel: () => void;
}

export default function TipoEscalaForm({
  initialValues,
  onSubmit,
  onCancel,
}: TipoEscalaFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [modoRepeticao, setModoRepeticao] = React.useState<string | undefined>(
    initialValues?.modoRepeticao || 'CICLO_DIAS'
  );

  const handleSubmit = async (values: unknown) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ativo: true,
        modoRepeticao: 'CICLO_DIAS',
        ...initialValues,
      }}
      onFinish={handleSubmit}
      onValuesChange={(changedValues) => {
        if (changedValues.modoRepeticao) {
          setModoRepeticao(changedValues.modoRepeticao);
        }
      }}
    >
      <Alert
        message="Tipos de Escala"
        description="Configure o padrão de trabalho/folga. Ex: 4x2 (4 dias de trabalho, 2 de folga), 5x1, Espanhola, etc."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="nome"
        label="Nome do Tipo"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { max: 255, message: 'Máximo 255 caracteres' },
        ]}
      >
        <Input placeholder="Ex: 4x2, 5x1, Espanhola" />
      </Form.Item>

      <Form.Item
        name="modoRepeticao"
        label="Modo de Repetição"
        rules={[{ required: true, message: 'Modo é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o modo"
          options={[
            { value: 'CICLO_DIAS', label: 'Ciclo de Dias (Ex: 4x2, 5x1)' },
            { value: 'SEMANA_DEPENDENTE', label: 'Semana Dependente (Ex: Espanhola)' },
          ]}
        />
      </Form.Item>

      {modoRepeticao === 'CICLO_DIAS' && (
        <Form.Item
          name="cicloDias"
          label="Dias no Ciclo"
          rules={[{ required: true, message: 'Número de dias é obrigatório' }]}
          tooltip="Total de dias no ciclo. Ex: 4x2 = 6 dias (4 trabalho + 2 folga)"
        >
          <InputNumber
            min={1}
            max={31}
            placeholder="Ex: 6 para 4x2"
            style={{ width: '100%' }}
          />
        </Form.Item>
      )}

      {modoRepeticao === 'SEMANA_DEPENDENTE' && (
        <Form.Item
          name="periodicidadeSemanas"
          label="Periodicidade em Semanas"
          rules={[{ required: true, message: 'Periodicidade é obrigatória' }]}
          tooltip="Quantas semanas até repetir o padrão. Ex: Espanhola = 2 semanas"
        >
          <InputNumber
            min={1}
            max={12}
            placeholder="Ex: 2 para Espanhola"
            style={{ width: '100%' }}
          />
        </Form.Item>
      )}

      <Form.Item
        name="minEletricistasPorTurno"
        label="Quantidade de Eletricistas Necessários"
        rules={[{ required: true, message: 'Quantidade de eletricistas é obrigatória' }]}
        tooltip="Total de eletricistas que compõem esta escala. Ex: 4x2 = 3, Espanhola = 2 ou 4, 4x1 = 5"
      >
        <InputNumber
          min={2}
          max={99}
          placeholder="Ex: 3 para escala 4x2"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="ativo"
        label="Ativo"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="observacoes"
        label="Observações"
      >
        <Input.TextArea
          rows={3}
          placeholder="Descreva o padrão ou observações adicionais..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Alert
        message="Nota"
        description={
          initialValues
            ? "Após salvar, você pode configurar as posições do ciclo ou máscaras de semana."
            : "Após criar o tipo, você poderá configurar as posições (Trabalho/Folga) detalhadamente."
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

