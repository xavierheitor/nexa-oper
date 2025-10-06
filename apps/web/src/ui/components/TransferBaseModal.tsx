/**
 * Modal para Transferência de Base
 *
 * Este componente implementa um modal para transferir eletricistas
 * ou veículos entre bases, com validação e feedback visual.
 *
 * FUNCIONALIDADES:
 * - Seleção de nova base
 * - Campo de motivo opcional
 * - Validação de dados
 * - Loading states
 * - Feedback de sucesso/erro
 *
 * COMO USAR:
 * ```typescript
 * <TransferBaseModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   onTransfer={handleTransfer}
 *   title="Transferir Eletricista"
 *   loading={false}
 * />
 * ```
 */

'use client';

import { Base } from '@nexa-oper/db';
import { Button, Form, Input, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { listBases } from '@/lib/actions/base/list';

interface TransferBaseModalProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (data: { novaBaseId: number; motivo?: string }) => Promise<void>;
  title: string;
  loading?: boolean;
}

export default function TransferBaseModal({
  open,
  onClose,
  onTransfer,
  title,
  loading = false,
}: TransferBaseModalProps) {
  const [form] = Form.useForm();
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);

  // Carrega bases ao abrir o modal
  useEffect(() => {
    if (open) {
      const loadBases = async () => {
        setLoadingBases(true);
        try {
          const result = await listBases({
            page: 1,
            pageSize: 1000,
            orderBy: 'nome',
            orderDir: 'asc',
          });

          if (result.success && result.data) {
            setBases(result.data.data);
          }
        } catch (error) {
          console.error('Erro ao carregar bases:', error);
        } finally {
          setLoadingBases(false);
        }
      };

      loadBases();
    }
  }, [open]);

  const handleSubmit = async (values: { novaBaseId: number; motivo?: string }) => {
    try {
      await onTransfer(values);
      form.resetFields();
    } catch (error) {
      // Mantém o modal aberto em caso de erro; logs já tratados externamente
      console.error('Erro ao transferir base:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* Campo Nova Base */}
        <Form.Item
          name="novaBaseId"
          label="Nova Base"
          rules={[
            { required: true, message: 'Nova base é obrigatória' }
          ]}
        >
          <Select
            placeholder="Selecione a nova base"
            loading={loadingBases}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={bases.map(base => ({
              value: base.id,
              label: base.nome,
            }))}
          />
        </Form.Item>

        {/* Campo Motivo */}
        <Form.Item
          name="motivo"
          label="Motivo da Transferência"
          rules={[
            { max: 500, message: 'Motivo deve ter no máximo 500 caracteres' }
          ]}
        >
          <Input.TextArea
            placeholder="Digite o motivo da transferência (opcional)"
            rows={3}
            maxLength={500}
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
              Transferir
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
