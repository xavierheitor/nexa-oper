'use client';

import { AprTipoAtividadeRelacao } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Modal } from 'antd';
import { AprVinculoModal } from './AprVinculoModal';
// Tipo helper baseado na estrutura real do useEntityData com paginação habilitada
// Nota: Este componente não usa pagination/handleTableChange, então tipo mínimo é suficiente
type UseEntityDataPaginated<T> = {
  data: T[];
  mutate: () => void;
};

interface AprVinculoModalWrapperProps {
  controller: CrudController<AprTipoAtividadeRelacao>;
  vinculos: UseEntityDataPaginated<AprTipoAtividadeRelacao>;
}

/**
 * Wrapper do Modal para criação de vínculo APR-TipoAtividade
 */
export function AprVinculoModalWrapper({ controller, vinculos }: AprVinculoModalWrapperProps) {
  return (
    <Modal
      title="Novo Vínculo APR - Tipo de Atividade"
      open={controller.isOpen}
      onCancel={controller.close}
      footer={null}
      destroyOnHidden
      width={500}
    >
      {controller.isOpen && (
        <AprVinculoModal
          onSaved={() => {
            controller.close();
            vinculos.mutate();
          }}
          controllerExec={controller.exec}
        />
      )}
    </Modal>
  );
}

