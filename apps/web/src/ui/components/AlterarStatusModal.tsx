/**
 * Modal para Alterar Status de Eletricista
 *
 * Este componente implementa um modal para alterar o status de eletricistas,
 * com validação e feedback visual.
 *
 * FUNCIONALIDADES:
 * - Seleção de novo status
 * - Campos de data início, data fim, motivo e observações
 * - Validação de dados
 * - Loading states
 * - Feedback de sucesso/erro
 *
 * COMO USAR:
 * ```typescript
 * <AlterarStatusModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   onAlterarStatus={handleAlterarStatus}
 *   eletricista={eletricista}
 *   statusAtual={statusAtual}
 *   loading={false}
 * />
 * ```
 */

'use client';

import { Button, DatePicker, Form, Input, Modal, Select, Tag } from 'antd';
import type { Rule } from 'antd/es/form';
import { useEffect } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { StatusEletricistaLabels, StatusEletricistaColors, StatusEletricistaEnum, StatusEletricista } from '@/lib/schemas/eletricistaStatusSchema';

const { TextArea } = Input;

interface AlterarStatusModalProps {
  open: boolean;
  onClose: () => void;
  onAlterarStatus: (data: {
    status: StatusEletricista;
    dataInicio: Date;
    dataFim?: Date;
    motivo?: string;
    observacoes?: string;
  }) => Promise<void>;
  eletricista?: { id: number; nome: string; Status?: { status: StatusEletricista } | null };
  statusAtual?: StatusEletricista;
  loading?: boolean;
}

export default function AlterarStatusModal({
  open,
  onClose,
  onAlterarStatus,
  eletricista,
  statusAtual,
  loading = false,
}: AlterarStatusModalProps) {
  const [form] = Form.useForm();

  // Status atual do eletricista
  const currentStatus = statusAtual || eletricista?.Status?.status || 'ATIVO';

  // Opções de status para o select
  const statusOptions = StatusEletricistaEnum.options.map(status => ({
    value: status,
    label: StatusEletricistaLabels[status],
  }));

  // Reset form ao abrir/fechar
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        status: currentStatus,
        dataInicio: dayjs(),
        dataFim: undefined,
        motivo: '',
        observacoes: '',
      });
    } else {
      form.resetFields();
    }
  }, [open, currentStatus, form]);

  const handleSubmit = async (values: {
    status: string;
    dataInicio: Dayjs;
    dataFim?: Dayjs;
    motivo?: string;
    observacoes?: string;
  }) => {
    try {
      await onAlterarStatus({
        status: values.status as StatusEletricista,
        dataInicio: values.dataInicio.toDate(),
        dataFim: values.dataFim?.toDate(),
        motivo: values.motivo,
        observacoes: values.observacoes,
      });
      form.resetFields();
    } catch (error) {
      // Mantém o modal aberto em caso de erro; logs já tratados externamente
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Handler para mudança de status
  const handleStatusChange = (value: string) => {
    // Se mudou para status final, sugere data fim como hoje
    if (value === 'DESLIGADO' || value === 'APOSENTADO') {
      form.setFieldsValue({ dataFim: dayjs() });
    }
  };

  // Validação para data fim
  const validateDataFim = (_: Rule, value: Dayjs | undefined) => {
    if (!value) return Promise.resolve();
    const dataInicio = form.getFieldValue('dataInicio');
    if (dataInicio && value.isBefore(dataInicio)) {
      return Promise.reject(new Error('Data fim deve ser posterior à data início'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={eletricista ? `Alterar Status - ${eletricista.nome}` : 'Alterar Status do Eletricista'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      width={600}
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
        {/* Status Atual (readonly) */}
        <Form.Item label="Status Atual">
          <Tag color={StatusEletricistaColors[currentStatus]}>
            {StatusEletricistaLabels[currentStatus]}
          </Tag>
        </Form.Item>

        {/* Campo Novo Status */}
        <Form.Item
          name="status"
          label="Novo Status"
          rules={[
            { required: true, message: 'Status é obrigatório' }
          ]}
        >
          <Select
            placeholder="Selecione o novo status"
            options={statusOptions}
            onChange={handleStatusChange}
            autoFocus
          />
        </Form.Item>

        {/* Campo Data Início */}
        <Form.Item
          name="dataInicio"
          label="Data Início"
          rules={[
            { required: true, message: 'Data início é obrigatória' }
          ]}
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

        {/* Botões */}
        <Form.Item>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Alterar Status
            </Button>
          </div>
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}

