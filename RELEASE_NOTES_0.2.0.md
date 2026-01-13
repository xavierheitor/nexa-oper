# Release Notes - v0.2.0 (Web Dashboard Refactoring)

## 🚀 Resumo

Esta versão foca na padronização visual, refatoração de código e melhoria da experiência do usuário
(UX) em todo o Dashboard Operacional. Foram implementados novos componentes de filtro, corrigidos
erros de tipagem e lógica, e introduzidas novas visualizações de dados.

## ✨ Novas Funcionalidades

- **Novas Tabelas Dinâmicas (Matrix Tables):**
  - Implementação de tabelas pivô para visualização de turnos por _Horário x Base_.
- **Filtros Avançados:**
  - Adição de filtros de **Status** (Trabalho, Falta, Atestado, etc.) nas páginas de Frequência e
    Turnos.
  - Suporte para filtro de "Turno Extra".
- **Visualização Aprimorada:**
  - Novos Cards de Filtros dedicados em páginas críticas (`/dashboard/frequencia`,
    `/dashboard/turnos`).
  - Uso de `TableExternalFilters` para padronizar filtros server-side em tabelas de cadastro.

## 🛠️ Refatoração & Qualidade de Código

- **Padronização de Interface:**
  - Refatoração das páginas de **Visão Geral de Frequência** e **Justificativas de Equipe** para
    remover filtros soltos e utilizar o padrão de Cards.
  - Unificação do design de componentes de filtro em todo o sistema.
- **Melhorias no Backend for Frontend (BFF):**
  - Refinamento do hook `useCrudController` para garantir revalidação automática de cache e
    tratamento de erros consistente.
  - Correção de tipagens no `TurnoPrevisto` e `StatusTurnoPrevisto`.

## 🐛 Correções de Bugs

- **Correção de Tipagem:** Resolução de erro onde o status `"EXTRA"` não era reconhecido como
  válido.
- **Lógica de Mapeamento:** Ajuste na lógica de mapeamento de dados nas páginas de `Turnos` e
  `Histórico` para evitar inconsistências.
- **Linting & Types:** Resolução de diversos erros de lint e TypeScript (`npm run type-check`
  passando com sucesso).

## 📦 Arquivos Impactados

- `apps/web/src/app/dashboard/turnos/page.tsx`
- `apps/web/src/app/dashboard/frequencia/visao-geral/page.tsx`
- `apps/web/src/app/dashboard/frequencia/justificativas-equipe/page.tsx`
- `apps/web/src/lib/types/turnoPrevisto.ts`
- `apps/web/src/ui/components/TableExternalFilters.tsx`
- `apps/web/src/lib/hooks/useCrudController.ts`
