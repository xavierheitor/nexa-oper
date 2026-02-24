'use client';

import { StatusEletricista, StatusEletricistaEnum, StatusEletricistaLabels, StatusEletricistaColors } from '@/lib/schemas/eletricistaStatusSchema';
import { Button, DatePicker, Form, Input, Select, Spin, Tag } from 'antd';
import { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

/**
 * Interface para dados do formulário de status
 */
export interface EletricistaStatusFormData {
  status: StatusEletricista;
  dataInicio: Date;
  dataFim?: Date;
  motivo?: string;
  observacoes?: string;
}

/**
 * Props do formulário de status
 */
interface EletricistaStatusFormProps {
  onSubmit: (values: EletricistaStatusFormData) => void;
  initialValues?: Partial<EletricistaStatusFormData>;
  statusAtual?: StatusEletricista;
  loading?: boolean;
}

export default function EletricistaStatusForm({
  onSubmit,
  initialValues,
  statusAtual,
  loading = false,
}: EletricistaStatusFormProps) {
  const [form] = Form.useForm();

  // Opções de status para o select
  const statusOptions = StatusEletricistaEnum.options.map(status => ({
    value: status,
    label: StatusEletricistaLabels[status],
  }));

  // Effect para gerenciar valores iniciais
  useEffect(() => {
    if (initialValues) {
      const formattedValues = {
        ...initialValues,
        dataInicio: initialValues.dataInicio ? dayjs(initialValues.dataInicio) : dayjs(),
        dataFim: initialValues.dataFim ? dayjs(initialValues.dataFim) : undefined,
      };
      form.setFieldsValue(formattedValues);
    } else {
      // Se não há valores iniciais, define valores padrão
      form.setFieldsValue({
        status: statusAtual || 'ATIVO',
        dataInicio: dayjs(),
      });
    }
  }, [initialValues, statusAtual, form]);

  // Validação para data fim
  const validateDataFim = (_: unknown, value: Dayjs | null) => {
    if (!value) return Promise.resolve();
    const dataInicio = form.getFieldValue('dataInicio');
    if (dataInicio && value.isBefore(dataInicio)) {
      return Promise.reject(new Error('Data fim deve ser posterior à data início'));
    }
    return Promise.resolve();
  };

  // Handler para mudança de status
  const handleStatusChange = (value: StatusEletricista) => {
    // Se mudou para status final, sugere data fim como hoje
    if (value === 'DESLIGADO' || value === 'APOSENTADO') {
      form.setFieldsValue({ dataFim: dayjs() });
    }
  };

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
      layout="vertical"
      onFinish={(values) => {
        onSubmit({
          ...values,
          dataInicio: values.dataInicio.toDate(),
          dataFim: values.dataFim?.toDate(),
        });
      }}
    >
      {/* Status Atual (readonly) */}
      {statusAtual && (
        <Form.Item label="Status Atual">
          <Tag color={StatusEletricistaColors[statusAtual]}>
            {StatusEletricistaLabels[statusAtual]}
          </Tag>
        </Form.Item>
      )}

      {/* Campo Novo Status */}
      <Form.Item
        name="status"
        label="Novo Status"
        rules={[{ required: true, message: 'Status é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o novo status"
          options={statusOptions}
          onChange={handleStatusChange}
        />
      </Form.Item>

      {/* Campo Data Início */}
      <Form.Item
        name="dataInicio"
        label="Data Início"
        rules={[{ required: true, message: 'Data início é obrigatória' }]}
        tooltip="Data em que o novo status entra em vigor"
      >
        <DatePicker
          format="DD/MM/YYYY"
          placeholder="Selecione a data início"
          style={{ width: '100%' }}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
        />
      </Form.Item>

      {/* Campo Data Fim (opcional) */}
      <Form.Item
        name="dataFim"
        label="Data Fim (Opcional)"
        tooltip="Deixe em branco se o status não tiver data de término prevista"
        rules={[{ validator: validateDataFim }]}
      >
        <DatePicker
          format="DD/MM/YYYY"
          placeholder="Selecione a data fim (opcional)"
          style={{ width: '100%' }}
          disabledDate={(current) => {
            const dataInicio = form.getFieldValue('dataInicio');
            return current && dataInicio && current.isBefore(dayjs(dataInicio));
          }}
        />
      </Form.Item>

      {/* Campo Motivo */}
      <Form.Item
        name="motivo"
        label="Motivo"
        tooltip="Motivo da mudança de status (opcional)"
      >
        <Input
          placeholder="Ex: Férias anuais, Licença médica, etc."
          maxLength={500}
          showCount
        />
      </Form.Item>

      {/* Campo Observações */}
      <Form.Item
        name="observacoes"
        label="Observações"
        tooltip="Observações adicionais sobre a mudança de status (opcional)"
      >
        <TextArea
          placeholder="Observações adicionais..."
          rows={4}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      {/* Botão de Submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          {initialValues ? 'Atualizar Status' : 'Registrar Status'}
        </Button>
      </Form.Item>
    </Form>
    </Spin>
  );
}
