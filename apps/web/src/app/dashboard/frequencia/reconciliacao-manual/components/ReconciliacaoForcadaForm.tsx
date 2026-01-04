'use client';

import { Form, DatePicker, InputNumber, Button, Space } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface ReconciliacaoForcadaFormProps {
  form: FormInstance;
  loading: boolean;
  loadingPendentes: boolean;
  onSubmit: (values: { diasHistorico?: number; dataInicio?: Dayjs; dataFim?: Dayjs }) => void;
  onVerificarPendentes: () => void;
}

/**
 * Componente de Formulário de Reconciliação Forçada
 *
 * Permite executar reconciliação forçada com período ou dias de histórico
 */
export function ReconciliacaoForcadaForm({
  form,
  loading,
  loadingPendentes,
  onSubmit,
  onVerificarPendentes,
}: ReconciliacaoForcadaFormProps) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        diasHistorico: 30,
      }}
    >
      <Form.Item
        name="diasHistorico"
        label="Dias no Histórico"
        tooltip="Número de dias para buscar no histórico (padrão: 30)"
      >
        <InputNumber
          min={1}
          max={365}
          style={{ width: '100%' }}
          placeholder="30"
        />
      </Form.Item>

      <Form.Item label="OU Período Específico">
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="dataInicio"
            noStyle
            tooltip="Data de início (opcional)"
          >
            <DatePicker
              style={{ width: '50%' }}
              format="DD/MM/YYYY"
              placeholder="Data início"
            />
          </Form.Item>
          <Form.Item
            name="dataFim"
            noStyle
            tooltip="Data de fim (opcional)"
          >
            <DatePicker
              style={{ width: '50%' }}
              format="DD/MM/YYYY"
              placeholder="Data fim"
            />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<ReloadOutlined />}
          >
            Executar Reconciliação Forçada
          </Button>
          <Button
            onClick={onVerificarPendentes}
            loading={loadingPendentes}
          >
            Verificar Pendências
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

