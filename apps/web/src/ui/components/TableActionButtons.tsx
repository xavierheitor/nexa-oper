/**
 * Componente de Botões de Ação para Tabelas
 *
 * Este componente fornece botões de ação padronizados para tabelas,
 * incluindo edição, exclusão e ações customizadas ilimitadas com
 * confirmação opcional, usando Ant Design para uma interface
 * consistente e profissional.
 *
 * FUNCIONALIDADES:
 * - Botões de edição e exclusão padronizados
 * - Ações customizadas ilimitadas com configuração flexível
 * - Confirmação opcional para qualquer ação
 * - Tooltips opcionais para todos os botões
 * - Interface genérica para qualquer tipo de registro
 * - Integração com Ant Design para consistência visual
 * - Callbacks opcionais para personalização
 * - Ícones intuitivos para melhor UX
 * - Suporte a diferentes tipos de botão (primary, danger, link, etc.)
 *
 * COMO FUNCIONA:
 * 1. Recebe um registro genérico e callbacks opcionais
 * 2. Renderiza botões condicionalmente baseado nos callbacks
 * 3. Botão de edição executa callback imediatamente
 * 4. Botão de exclusão mostra confirmação antes de executar
 * 5. Ações customizadas são renderizadas dinamicamente
 * 6. Cada ação customizada pode ter confirmação opcional
 * 7. Usa Space do Ant Design para espaçamento consistente
 *
 * BENEFÍCIOS:
 * - Reutilização em múltiplas tabelas
 * - Interface consistente em toda aplicação
 * - Prevenção de exclusões acidentais
 * - Ações customizadas ilimitadas
 * - Type safety com TypeScript genérico
 * - Fácil manutenção e customização
 * - Flexibilidade total para diferentes casos de uso
 *
 * EXEMPLO DE USO BÁSICO:
 * ```tsx
 * // Em uma tabela Ant Design
 * const columns = [
 *   { title: 'Nome', dataIndex: 'name', key: 'name' },
 *   {
 *     title: 'Ações',
 *     key: 'actions',
 *     render: (record: User) => (
 *       <TableActionButtons
 *         record={record}
 *         onEdit={(user) => handleEdit(user)}
 *         onDelete={(user) => handleDelete(user.id)}
 *         editTooltip="Editar usuário"
 *         deleteTooltip="Excluir usuário"
 *       />
 *     ),
 *   },
 * ];
 * ```
 *
 * EXEMPLO DE USO COM AÇÕES CUSTOMIZADAS:
 * ```tsx
 * // Tabela com ações customizadas
 * const productColumns = [
 *   { title: 'Produto', dataIndex: 'name', key: 'name' },
 *   { title: 'Preço', dataIndex: 'price', key: 'price' },
 *   {
 *     title: 'Ações',
 *     key: 'actions',
 *     render: (record: Product) => (
 *       <TableActionButtons
 *         record={record}
 *         onEdit={(product) => openEditModal(product)}
 *         onDelete={(product) => deleteProduct(product.id)}
 *         editTooltip="Editar produto"
 *         deleteTooltip="Excluir produto"
 *         customActions={[
 *           {
 *             key: 'view',
 *             label: 'Visualizar',
 *             type: 'link',
 *             tooltip: 'Visualizar detalhes do produto',
 *             onClick: (product) => viewProduct(product.id)
 *           },
 *           {
 *             key: 'download',
 *             label: 'Download',
 *             type: 'link',
 *             tooltip: { title: 'Baixar arquivo', placement: 'top' },
 *             onClick: (product) => downloadProduct(product.id)
 *           },
 *           {
 *             key: 'duplicate',
 *             label: 'Duplicar',
 *             type: 'link',
 *             tooltip: 'Criar uma cópia deste produto',
 *             confirm: {
 *               title: 'Duplicar Produto',
 *               description: 'Deseja criar uma cópia deste produto?',
 *               okText: 'Duplicar',
 *               cancelText: 'Cancelar'
 *             },
 *             onClick: (product) => duplicateProduct(product)
 *           }
 *         ]}
 *       />
 *     ),
 *   },
 * ];
 * ```
 *
 * EXEMPLO DE AÇÕES COM CONFIRMAÇÃO:
 * ```tsx
 * // Ações que requerem confirmação
 * const orderColumns = [
 *   { title: 'Pedido', dataIndex: 'orderNumber', key: 'orderNumber' },
 *   { title: 'Status', dataIndex: 'status', key: 'status' },
 *   {
 *     title: 'Ações',
 *     key: 'actions',
 *     render: (record: Order) => (
 *       <TableActionButtons
 *         record={record}
 *         customActions={[
 *           {
 *             key: 'approve',
 *             label: 'Aprovar',
 *             type: 'primary',
 *             confirm: {
 *               title: 'Aprovar Pedido',
 *               description: 'Tem certeza que deseja aprovar este pedido?',
 *               okText: 'Aprovar',
 *               cancelText: 'Cancelar'
 *             },
 *             onClick: (order) => approveOrder(order.id)
 *           },
 *           {
 *             key: 'reject',
 *             label: 'Rejeitar',
 *             type: 'default',
 *             danger: true,
 *             confirm: {
 *               title: 'Rejeitar Pedido',
 *               description: 'Esta ação não pode ser desfeita. Continuar?',
 *               okText: 'Rejeitar',
 *               cancelText: 'Cancelar'
 *             },
 *             onClick: (order) => rejectOrder(order.id)
 *           }
 *         ]}
 *       />
 *     ),
 *   },
 * ];
 * ```
 */

// Diretiva para indicar que é um componente cliente
'use client';

// Importações necessárias
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'; // Ícones
import { Button, Popconfirm, Space, Tooltip } from 'antd'; // Componentes do Ant Design
import React from 'react';

/**
 * Interface para ações customizadas
 *
 * Define a estrutura de uma ação customizada que pode ser adicionada
 * aos botões de ação da tabela.
 */
export interface CustomAction<T> {
  key: string;                    // Chave única para identificar a ação
  label: string;                  // Texto do botão
  icon?: React.ReactNode;         // Ícone do botão (opcional)
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text'; // Tipo do botão
  danger?: boolean;               // Se o botão é perigoso (vermelho)
  visible?: (record: T) => boolean; // Função para controlar visibilidade por linha
  tooltip?: string | {            // Configuração de tooltip (opcional)
    title: string;                // Texto do tooltip
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom'; // Posição do tooltip
  };
  confirm?: {                     // Configuração de confirmação (opcional)
    title: string;                // Título da confirmação
    description: string;          // Descrição da confirmação
    okText?: string;              // Texto do botão OK
    cancelText?: string;          // Texto do botão Cancelar
  };
  onClick: (record: T) => void;   // Função executada ao clicar
}

/**
 * Interface para as props do componente TableActionButtons
 *
 * Define a estrutura das propriedades que o componente aceita,
 * usando TypeScript genérico para flexibilidade com qualquer tipo de registro.
 *
 * @template T - Tipo genérico do registro da tabela
 */
interface TableActionButtonsProps<T> {
  record: T;                    // Registro da linha da tabela
  onEdit?: (record: T) => void; // Callback opcional para edição
  onDelete?: (record: T) => void; // Callback opcional para exclusão
  customActions?: CustomAction<T>[]; // Ações customizadas adicionais
  editTooltip?: string;         // Tooltip para o botão de edição
  deleteTooltip?: string;       // Tooltip para o botão de exclusão
}

/**
 * Componente TableActionButtons - Botões de ação para tabelas
 *
 * Componente reutilizável que renderiza botões de ação padronizados
 * para tabelas, incluindo edição e exclusão com confirmação.
 *
 * @template T - Tipo genérico do registro da tabela
 * @param props - Propriedades do componente
 * @returns JSX com botões de ação
 */
export default function TableActionButtons<T>({
  record,         // Registro da linha da tabela
  onEdit,         // Callback opcional para edição
  onDelete,       // Callback opcional para exclusão
  customActions,  // Ações customizadas adicionais
  editTooltip,    // Tooltip para o botão de edição
  deleteTooltip,  // Tooltip para o botão de exclusão
}: TableActionButtonsProps<T>) {
  /**
   * Função para renderizar um botão com tooltip opcional
   *
   * Esta função envolve um botão com tooltip se a configuração fornecida.
   *
   * @param button - Elemento do botão a ser envolvido
   * @param tooltip - Configuração do tooltip (string ou objeto)
   * @returns JSX do botão com ou sem tooltip
   */
  const renderWithTooltip = (button: React.ReactElement, tooltip?: string | { title: string; placement?: string }) => {
    if (!tooltip) return button;

    const tooltipProps = typeof tooltip === 'string'
      ? { title: tooltip }
      : { title: tooltip.title, placement: tooltip.placement as any };

    return (
      <Tooltip {...tooltipProps}>
        {button}
      </Tooltip>
    );
  };

  /**
   * Função para renderizar uma ação customizada
   *
   * Esta função cria um botão baseado na configuração da ação customizada.
   * Se a ação tiver confirmação configurada, envolve o botão com Popconfirm.
   * Se a ação tiver tooltip configurado, envolve o botão com Tooltip.
   *
   * @param action - Ação customizada a ser renderizada
   * @returns JSX do botão com ou sem confirmação e tooltip
   */
  const renderCustomAction = (action: CustomAction<T>) => {
    const button = (
      <Button
        type={action.type || 'link'}
        danger={action.danger}
        icon={action.icon}
        onClick={() => action.onClick(record)}
      >
        {action.label}
      </Button>
    );

    // Quando há confirmação configurada, envolve com Popconfirm
    if (action.confirm) {
      const buttonWithConfirm = (
        <Popconfirm
          title={action.confirm.title}
          description={action.confirm.description}
          okText={action.confirm.okText || 'Sim'}
          cancelText={action.confirm.cancelText || 'Não'}
          onConfirm={() => action.onClick(record)}
        >
          {button}
        </Popconfirm>
      );

      // Aplica tooltip se configurado
      return renderWithTooltip(buttonWithConfirm, action.tooltip);
    }

    // Sem confirmação: aplica tooltip se configurado
    return renderWithTooltip(button, action.tooltip);
  };

  return (
    <Space>
      {/* Botão de Edição - Renderizado condicionalmente */}
      {onEdit && (
        <Tooltip title={editTooltip || 'Editar'}>
          <Button
            type='link'
            aria-label='Editar'
            onClick={() => onEdit(record)}
            icon={<EditOutlined />}
          />
        </Tooltip>
      )}

      {/* Botão de Exclusão com Confirmação */}
      {onDelete && (
        <Popconfirm
          title='Excluir'                                    // Título do popup
          description='Tem certeza que deseja excluir este item?' // Descrição da confirmação
          okText='Sim'                                       // Texto do botão de confirmação
          cancelText='Não'                                   // Texto do botão de cancelamento
          onConfirm={() => onDelete?.(record)}              // Callback executado ao confirmar
        >
          <Tooltip title={deleteTooltip || 'Excluir'}>
            <Button
              type='link'
              aria-label='Excluir'
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      )}

      {/* Ações Customizadas - Renderizadas dinamicamente */}
      {/* Mapeia cada ação customizada e renderiza o botão correspondente */}
      {customActions
        ?.filter((action) => (action.visible ? action.visible(record) : true))
        .map((action) => (
          <React.Fragment key={action.key}>
            {renderCustomAction(action)}
          </React.Fragment>
        ))}
    </Space>
  );
}
