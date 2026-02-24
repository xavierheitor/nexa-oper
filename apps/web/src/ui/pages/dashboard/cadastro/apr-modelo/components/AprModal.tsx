'use client';

import { Apr } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Modal } from 'antd';
import AprForm, { AprFormData } from '../form';

interface AprModalProps {
  controller: CrudController<Apr>;
  onSubmit: (values: AprFormData) => Promise<void>;
}

/**
 * Componente Modal para criação/edição de APRs
 *
 * Wrapper do Modal que contém o formulário de APR
 */
export function AprModal({ controller, onSubmit }: AprModalProps) {
  return (
    <Modal
      title={controller.editingItem ? 'Editar APR' : 'Nova APR'}
      open={controller.isOpen}
      onCancel={controller.close}
      footer={null}
      destroyOnHidden
      width={800}
      style={{ top: 20 }}
    >
      <AprForm
        initialValues={
          controller.editingItem
            ? {
                id: controller.editingItem.id,
                nome: controller.editingItem.nome,
                // Os relacionamentos são carregados automaticamente pelo form
                perguntaIds: [],
                opcaoRespostaIds: []
              }
            : undefined
        }
        onSubmit={onSubmit}
        loading={controller.loading}
      />
    </Modal>
  );
}

