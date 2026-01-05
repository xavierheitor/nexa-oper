/**
 * Componente Genérico para Páginas CRUD
 *
 * Este componente encapsula a estrutura completa de uma página CRUD simples,
 * reduzindo drasticamente a quantidade de código necessário.
 *
 * FUNCIONALIDADES:
 * - Estrutura completa: Card + Table + Modal + Form
 * - Integração com useEntityData e useCrudController
 * - Suporte a colunas customizadas
 * - Suporte a formulário customizado
 * - Ações de criar, editar e excluir
 * - Loading states e tratamento de erros
 *
 * BENEFÍCIOS:
 * - Reduz código de ~150 linhas para ~30 linhas por página
 * - Padroniza estrutura de páginas CRUD
 * - Facilita manutenção
 * - Type safety completo
 *
 * EXEMPLO DE USO:
 * ```typescript
 * export default function BasePage() {
 *   const controller = useCrudController<Base>('bases');
 *   const bases = useEntityData<Base>({...});
 *   const handleSubmit = useCrudFormHandler({...});
 *
 *   return (
 *     <CrudPage
 *       title="Bases"
 *       entityKey="bases"
 *       controller={controller}
 *       entityData={bases}
 *       columns={columns}
 *       formComponent={BaseForm}
 *       onSubmit={handleSubmit}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import React from 'react';
import { Card, Table, Modal, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
/**
 * Props do componente
 */
export interface CrudPageProps<TEntity, TFormData = Record<string, unknown>> {
  /**
   * Título da página (aparece no Card)
   */
  title: string;

  /**
   * Chave da entidade (para cache SWR)
   */
  entityKey: string;

  /**
   * Controller do useCrudController
   */
  controller: {
    isOpen: boolean;
    editingItem: TEntity | null;
    loading: boolean;
    open: (item?: TEntity) => void;
    close: () => void;
  };

  /**
   * Dados da entidade do useEntityData
   */
  entityData: {
    data: TEntity[] | undefined;
    isLoading: boolean;
    error: unknown;
    mutate: () => void;
    pagination: TableProps<TEntity>['pagination'];
    handleTableChange: TableProps<TEntity>['onChange'];
  };

  /**
   * Colunas da tabela
   */
  columns: ColumnsType<TEntity>;

  /**
   * Componente do formulário
   */
  formComponent: React.ComponentType<{
    initialValues?: Partial<TFormData>;
    onSubmit: (values: TFormData) => Promise<void>;
    loading?: boolean;
  }>;

  /**
   * Handler de submit do formulário
   */
  onSubmit: (values: TFormData) => Promise<void>;

  /**
   * Largura do modal
   * @default 600
   */
  modalWidth?: number;

  /**
   * Texto do botão de adicionar
   * @default 'Adicionar'
   */
  addButtonText?: string;

  /**
   * Se deve ocultar o botão de adicionar
   * @default false
   */
  hideAddButton?: boolean;

  /**
   * Se deve destruir o modal ao fechar
   * @default true
   */
  destroyOnHidden?: boolean;
}

/**
 * Componente genérico para páginas CRUD
 */
export default function CrudPage<TEntity extends { id: number | string }, TFormData = Record<string, unknown>>({
  title,
  controller,
  entityData,
  columns,
  formComponent: FormComponent,
  onSubmit,
  modalWidth = 600,
  addButtonText = 'Adicionar',
  hideAddButton = false,
  destroyOnHidden = true,
}: CrudPageProps<TEntity, TFormData>) {
  // Se há erro no carregamento, exibe mensagem de erro
  if (entityData.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar {title.toLowerCase()}.</p>;
  }

  // Determina valores iniciais do formulário
  // Por padrão, passa undefined e deixa o formulário lidar com valores padrão
  // Páginas específicas podem passar getInitialValues customizado via props se necessário
  const getInitialValues = (): Partial<TFormData> | undefined => {
    if (!controller.editingItem) return undefined;
    // Retorna o item sendo editado - formulários devem mapear campos apropriadamente
    return controller.editingItem as unknown as Partial<TFormData>;
  };

  return (
    <>
      {/* Card principal que contém a tabela */}
          <Card
            title={title}
            extra={
              !hideAddButton ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => controller.open()}>
                  {addButtonText}
                </Button>
              ) : undefined
            }
          >
        {/* Tabela principal com dados */}
        <Table<TEntity>
          columns={columns}
          dataSource={entityData.data}
          loading={entityData.isLoading}
          rowKey="id"
          pagination={entityData.pagination}
          onChange={entityData.handleTableChange}
        />
      </Card>

      {/* Modal para criação/edição */}
      <Modal
        title={controller.editingItem ? `Editar ${title.slice(0, -1)}` : `Nova ${title.slice(0, -1)}`}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden={destroyOnHidden}
        width={modalWidth}
      >
        {/* Formulário de criação/edição */}
        <FormComponent
          initialValues={getInitialValues()}
          onSubmit={async (values) => {
            await onSubmit(values);
            controller.close();
          }}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}

