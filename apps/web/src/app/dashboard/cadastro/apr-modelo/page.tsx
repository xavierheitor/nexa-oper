/**
 * Página de Gerenciamento de APRs (Análise Preliminar de Risco)
 *
 * Esta página implementa o CRUD completo para APRs,
 * seguindo os padrões de design e arquitetura da aplicação.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada de APRs
 * - Criação de novas APRs via modal
 * - Edição de APRs existentes
 * - Exclusão com confirmação
 * - Busca e filtros em tempo real
 * - Ordenação por colunas
 * - Feedback visual de operações
 * - Tratamento de erros padronizado
 * - Exibição de contadores de relacionamentos
 * - Transfer components para vinculação
 *
 * COMPONENTES UTILIZADOS:
 * - useEntityData: Gerenciamento de dados e paginação
 * - useCrudController: Controle de modais e operações
 * - AprTable: Componente de tabela de APRs
 * - AprVinculoTable: Componente de tabela de vínculos
 * - AprModal: Modal wrapper para formulário
 * - AprVinculoModalWrapper: Modal wrapper para vínculos
 */

'use client';

import { createApr } from '@/lib/actions/apr/create';
import { updateApr } from '@/lib/actions/apr/update';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { ActionResult } from '@/lib/types/common';
import { Apr, AprTipoAtividadeRelacao } from '@nexa-oper/db';
import { listAprs } from '@/lib/actions/apr/list';
import { listAprTipoAtividadeVinculos } from '@/lib/actions/aprVinculo/tipoAtividade/list';
import { Spin } from 'antd';
import { AprTable } from './components/AprTable';
import { AprVinculoTable } from './components/AprVinculoTable';
import { AprModal } from './components/AprModal';
import { AprVinculoModalWrapper } from './components/AprVinculoModalWrapper';
import type { AprFormData } from './form';

/**
 * Componente principal da página de APRs
 *
 * Renderiza a interface completa para gerenciamento de APRs,
 * incluindo listagem, criação, edição e exclusão com
 * Transfer components para vinculação de relacionamentos.
 *
 * @returns JSX.Element - Interface completa da página
 */
export default function AprPage() {
  // Controller para gerenciar estado de modais e operações CRUD
  const controller = useCrudController<Apr>('aprs');

  // Controller para gerenciar vínculos APR-TipoAtividade
  const taController = useCrudController<AprTipoAtividadeRelacao>('apr-ta-vinculos');

  // Hook para gerenciamento de dados com paginação automática
  const aprs = useEntityData<Apr>({
    key: 'aprs',
    fetcherAction: unwrapFetcher(listAprs),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        AprPerguntaRelacao: true,
        AprOpcaoRespostaRelacao: true,
      },
    },
  });

  // Hook para gerenciamento de vínculos APR-TipoAtividade
  const taVinculos = useEntityData<AprTipoAtividadeRelacao>({
    key: 'apr-ta-vinculos',
    fetcherAction: unwrapFetcher(listAprTipoAtividadeVinculos),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        apr: true,
        tipoAtividade: true,
      },
    },
  });

  /**
   * Handler para submit do formulário
   *
   * Processa tanto criação quanto edição baseado no estado
   * do controller (editingItem presente ou não).
   * Gerencia automaticamente os relacionamentos via Transfer components.
   *
   * @param values - Dados validados do formulário incluindo arrays de IDs
   */
  const handleSubmit = async (values: AprFormData) => {
    const action = async (): Promise<ActionResult<Apr>> => {
      // Determina se é edição ou criação
      const result = controller.editingItem?.id
        ? await updateApr({ ...values, id: controller.editingItem.id })
        : await createApr(values);

      return result;
    };

    // Executa ação com feedback automático
    controller
      .exec(action, 'APR salva com sucesso!')
      .finally(() => aprs.mutate());
  };

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Loading state para toda a página
  if (aprs.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar APRs.</p>;
  }

  return (
    <>
      <AprTable aprs={aprs} controller={controller} />
      <AprVinculoTable vinculos={taVinculos} controller={taController} />
      <AprModal controller={controller} onSubmit={handleSubmit} />
      <AprVinculoModalWrapper controller={taController} vinculos={taVinculos} />
    </>
  );
}
