/**
 * Hook para Construção de Colunas de Tabela com Ações
 *
 * Este hook facilita a criação de colunas de tabela do Ant Design com
 * botões de ação padronizados, integrando perfeitamente com o componente
 * TableActionButtons para uma experiência consistente.
 *
 * FUNCIONALIDADES:
 * - Adiciona coluna de ações automaticamente às colunas base
 * - Integração completa com TableActionButtons
 * - Suporte a ações customizadas via CustomAction[]
 * - Type safety completo com TypeScript genérico
 * - Configuração flexível de callbacks
 * - Reutilização em múltiplas tabelas
 *
 * COMO FUNCIONA:
 * 1. Recebe colunas base da tabela
 * 2. Recebe opções de configuração das ações
 * 3. Adiciona coluna de ações com TableActionButtons
 * 4. Retorna array completo de colunas
 *
 * BENEFÍCIOS:
 * - Reduz boilerplate na criação de tabelas
 * - Padronização automática de ações
 * - Integração perfeita com TableActionButtons
 * - Flexibilidade para ações customizadas
 * - Código mais limpo e manutenível
 *
 * EXEMPLO DE USO:
 * ```tsx
 * // Hook básico
 * const columns = useTableColumnsWithActions(
 *   baseColumns,
 *   {
 *     onEdit: (user) => handleEdit(user),
 *     onDelete: (user) => handleDelete(user.id)
 *   }
 * );
 *
 * // Com ações customizadas
 * const columns = useTableColumnsWithActions(
 *   baseColumns,
 *   {
 *     onEdit: (user) => handleEdit(user),
 *     onDelete: (user) => handleDelete(user.id),
 *     customActions: [
 *       {
 *         key: 'view',
 *         label: 'Visualizar',
 *         type: 'link',
 *         onClick: (user) => viewUser(user.id)
 *       }
 *     ]
 *   }
 * );
 * ```
 */

// Diretiva para indicar que é um hook cliente
'use client';

// Importações necessárias
import { TableColumnsType } from 'antd'; // Tipos do Ant Design
import TableActionButtons, { type CustomAction } from '../../ui/components/TableActionButtons'; // Componente de ações

/**
 * Interface para ações customizadas (re-exportada para compatibilidade)
 *
 * Esta interface é re-exportada do TableActionButtons para manter
 * compatibilidade e evitar duplicação de tipos.
 */
export type { CustomAction } from '../../ui/components/TableActionButtons';

/**
 * Interface para as opções de configuração do hook
 *
 * Define as opções disponíveis para configurar as ações da tabela,
 * incluindo callbacks padrão e ações customizadas.
 *
 * @template T - Tipo genérico do registro da tabela
 */
interface UseTableColumnsWithActionsOptions<T> {
  onEdit?: (record: T) => void; // Callback para edição
  onDelete?: (record: T) => Promise<void> | void; // Callback para exclusão
  customActions?: CustomAction<T>[]; // Ações customizadas adicionais
}

/**
 * Hook para adicionar coluna de ações às colunas de tabela
 *
 * Este hook recebe as colunas base de uma tabela e adiciona automaticamente
 * uma coluna de ações usando o componente TableActionButtons, proporcionando
 * uma experiência consistente e padronizada em toda a aplicação.
 *
 * @template T - Tipo genérico do registro da tabela
 * @param baseColumns - Colunas base da tabela
 * @param options - Opções de configuração das ações
 * @returns Array completo de colunas incluindo a coluna de ações
 *
 * EXEMPLOS:
 * ```tsx
 * // Uso básico
 * const columns = useTableColumnsWithActions(
 *   [
 *     { title: 'Nome', dataIndex: 'name', key: 'name' },
 *     { title: 'Email', dataIndex: 'email', key: 'email' }
 *   ],
 *   {
 *     onEdit: (user) => openEditModal(user),
 *     onDelete: (user) => deleteUser(user.id)
 *   }
 * );
 *
 * // Com ações customizadas
 * const columns = useTableColumnsWithActions(
 *   baseColumns,
 *   {
 *     onEdit: (user) => editUser(user),
 *     onDelete: (user) => deleteUser(user.id),
 *     customActions: [
 *       {
 *         key: 'view',
 *         label: 'Visualizar',
 *         type: 'link',
 *         onClick: (user) => viewUser(user.id)
 *       },
 *       {
 *         key: 'reset-password',
 *         label: 'Resetar Senha',
 *         type: 'link',
 *         danger: true,
 *         confirm: {
 *           title: 'Resetar Senha',
 *           description: 'Uma nova senha será enviada por email. Continuar?',
 *           okText: 'Resetar',
 *           cancelText: 'Cancelar'
 *         },
 *         onClick: (user) => resetPassword(user.id)
 *       }
 *     ]
 *   }
 * );
 * ```
 */
export function useTableColumnsWithActions<T>(
  baseColumns: TableColumnsType<T>, // Colunas base da tabela
  options: UseTableColumnsWithActionsOptions<T> // Opções de configuração
): TableColumnsType<T> {
  // Retorna array de colunas incluindo a coluna de ações
  return [
    ...baseColumns, // Espalha as colunas base
    {
      title: 'Ações', // Título da coluna de ações
      key: 'actions', // Chave única da coluna
      width: 120, // Largura fixa para a coluna de ações
      align: 'center' as const, // Centraliza o conteúdo da coluna
      render: (_, record) => ( // Função de renderização
        <TableActionButtons
          record={record} // Registro da linha
          onEdit={options.onEdit} // Callback de edição
          onDelete={options.onDelete} // Callback de exclusão
          customActions={options.customActions} // Ações customizadas
        />
      ),
    },
  ];
}
