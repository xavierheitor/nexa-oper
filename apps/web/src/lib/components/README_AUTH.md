# Sistema de Autenticação e Proteção de Rotas

## Visão Geral

Este sistema implementa proteção completa de rotas `/dashboard` com verificação de autenticação em
múltiplas camadas:

1. **Middleware do Next.js** - Proteção no nível de servidor
2. **AuthGuard Component** - Proteção no nível de componente
3. **useAuth Hook** - Verificação no cliente
4. **Action Handler** - Verificação em Server Actions

## Componentes Criados

### 1. Middleware (`src/middleware.ts`)

Protege todas as rotas `/dashboard/*` no nível de servidor, redirecionando automaticamente para
`/login` se não houver sessão válida.

**Como funciona:**

- Intercepta todas as requisições para `/dashboard/*`
- Verifica token de autenticação
- Redireciona para `/login` se não autenticado

### 2. AuthGuard (`src/lib/components/AuthGuard.tsx`)

Componente que protege rotas verificando autenticação antes de renderizar conteúdo.

**Uso:**

```tsx
<AuthGuard>
  <MinhaPagina />
</AuthGuard>

// Com permissão (futuro)
<AuthGuard requiredPermission="dashboard:view">
  <MinhaPagina />
</AuthGuard>
```

### 3. useAuth Hook (`src/lib/hooks/useAuth.ts`)

Hook para verificar autenticação no cliente.

**Uso:**

```tsx
const { user, isAuthenticated, isLoading, hasPermission, logout } = useAuth();

if (!isAuthenticated) {
  return <div>Carregando...</div>;
}
```

### 4. Sistema de Permissões (`src/lib/types/permissions.ts`)

Estrutura preparada para sistema de permissões futuro.

**Permissões previstas:**

- Formato: `'recurso:acao'` (ex: `'dashboard:view'`, `'users:create'`)
- Roles: `'admin'`, `'manager'`, `'user'`

## Correções Implementadas

### ✅ Logout

- Corrigido para redirecionar para `/login` com `callbackUrl` e `redirect: true`

### ✅ Redirecionamento de Actions

- `useDataFetch` já trata `redirectToLogin` automaticamente
- `useCrudController` já trata `redirectToLogin` automaticamente
- `unwrapFetcher` já trata `redirectToLogin` automaticamente

### ✅ Proteção de Rotas Dashboard

- Middleware protege todas as rotas `/dashboard/*`
- Layout do dashboard usa `AuthGuard` para proteção adicional
- Página inicial verifica sessão antes de redirecionar

### ✅ Prevenção de Conteúdo Zerado

- `AuthGuard` só renderiza conteúdo após verificar autenticação
- Redirecionamento usa `window.location.href` para recarregamento completo

## Como Usar em Novas Páginas

### Opção 1: Usar AuthGuard no Layout (Recomendado)

O layout do dashboard já está protegido, então todas as páginas filhas são automaticamente
protegidas.

### Opção 2: Usar AuthGuard Individualmente

```tsx
export default function MinhaPagina() {
  return (
    <AuthGuard>
      <div>Conteúdo protegido</div>
    </AuthGuard>
  );
}
```

### Opção 3: Usar useAuth Hook

```tsx
export default function MinhaPagina() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spin />;
  if (!isAuthenticated) return null;

  return <div>Conteúdo protegido</div>;
}
```

## Preparação para Permissões Futuras

O sistema está preparado para adicionar permissões facilmente:

1. **Adicionar permissões ao usuário na sessão:**

```typescript
// Em auth.config.ts, no callback jwt:
token.permissions = user.permissions;
token.roles = user.roles;
```

1. **Usar permissões em componentes:**

```tsx
<AuthGuard requiredPermission='dashboard:view'>
  <MinhaPagina />
</AuthGuard>
```

1. **Verificar permissões em código:**

```tsx
const { hasPermission } = useAuth();
if (hasPermission('users:create')) {
  // Mostrar botão de criar
}
```

## Arquivos Modificados

- ✅ `src/middleware.ts` - Criado middleware de proteção
- ✅ `src/app/dashboard/layout.tsx` - Adicionado AuthGuard
- ✅ `src/app/page.tsx` - Verificação de sessão antes de redirecionar
- ✅ `src/ui/components/SidebarMenu.tsx` - Corrigido logout
- ✅ `src/lib/components/AuthGuard.tsx` - Criado componente de proteção
- ✅ `src/lib/hooks/useAuth.ts` - Criado hook de autenticação
- ✅ `src/lib/types/permissions.ts` - Criado estrutura de permissões
- ✅ `src/lib/utils/redirectHandler.ts` - Criado utilitário de redirecionamento
