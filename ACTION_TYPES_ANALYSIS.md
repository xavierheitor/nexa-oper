# 🔍 Análise de Rigidez do Sistema ActionTypes - Nexa Oper

## 📋 Problema Identificado

### **Rigidez Atual**

O sistema atual tem uma rigidez significativa na criação de novos `ActionTypes`:

#### **1. Definição Hardcoded**

```typescript
// 🚫 RÍGIDO: Definição fixa em common.ts
export type ActionType = 'create' | 'update' | 'delete' | 'get' | 'list' | 'changePassword';
```

#### **2. Logger Hardcoded**

```typescript
// 🚫 RÍGIDO: withLogging com tipos fixos
export async function withLogging<T>(
  session: Session,
  actionType: 'create' | 'update' | 'delete' | 'get' | 'list' | 'changePassword'
  // ...
);
```

#### **3. Processo Manual**

Para adicionar um novo `ActionType` como `resetPassword`:

1. ✏️ Editar `common.ts` → Adicionar 'resetPassword'
2. ✏️ Editar `logger.ts` → Adicionar 'resetPassword'
3. ✏️ Verificar `actionHandler.ts` → Pode precisar de ajustes
4. 🔄 Recompilar tudo
5. 🧪 Testar se quebrou algo

### **Impacto no Desenvolvimento**

- **Lentidão**: Cada novo tipo requer mudanças em 3+ arquivos
- **Risco**: Alterações em arquivos centrais podem quebrar outras funcionalidades
- **Limitação**: Desenvolvedores hesitam em criar actions específicas
- **Manutenção**: Código central fica poluído com casos específicos

---

## 🎯 Casos de Uso Bloqueados

### **Exemplo: Reset de Senha**

```typescript
// ❌ ATUAL: Não é possível sem alterar arquivos centrais
export const resetUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetPasswordSchema,
    async (data, session) => {
      // Lógica específica de reset
      return service.resetPassword(data, session.user.id);
    },
    rawData,
    { entityName: 'User', actionType: 'resetPassword' } // ❌ Erro: não existe
  );
```

### **Outros Casos Bloqueados**

- `activateUser` / `deactivateUser`
- `approveContract` / `rejectContract`
- `sendNotification`
- `generateReport`
- `importData` / `exportData`
- `cloneEntity`
- `archiveEntity`

---

## 🚀 Solução Proposta

### **1. ActionType Flexível**

#### **Antes (Rígido)**

```typescript
export type ActionType = 'create' | 'update' | 'delete' | 'get' | 'list' | 'changePassword';
```

#### **Depois (Flexível)**

```typescript
// Tipos base sempre disponíveis
export type BaseActionType = 'create' | 'update' | 'delete' | 'get' | 'list';

// Tipo flexível que aceita qualquer string
export type ActionType = BaseActionType | string;

// Mapeamento para logging (opcional)
export const ACTION_TYPE_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  get: 'Consulta',
  list: 'Listagem',
  changePassword: 'Alteração de Senha',
  resetPassword: 'Reset de Senha',
  // Mais tipos podem ser adicionados dinamicamente
};
```

### **2. Logger Flexível**

#### **Antes (Rígido)***

```typescript
export async function withLogging<T>(
  session: Session,
  actionType: 'create' | 'update' | 'delete' | 'get' | 'list' | 'changePassword'
  // ...
);
```

#### **Depois (Flexível)***

```typescript
export async function withLogging<T>(
  session: Session,
  actionType: string, // ✅ Aceita qualquer string
  entity: string,
  input: unknown,
  logic: () => Promise<T>
): Promise<T> {
  // Usa mapeamento ou o tipo diretamente
  const actionLabel = ACTION_TYPE_LABELS[actionType] || actionType;

  try {
    const result = await logic();

    logger.action(`[${actionLabel.toUpperCase()}] ${entity}`, {
      userId: session.user.id,
      actionType, // Tipo original
      input,
      output: result,
    });

    return result;
  } catch (error) {
    logger.error(`[${actionLabel.toUpperCase()}] ${entity} - Error`, {
      userId: session.user.id,
      actionType,
      input,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
```

### **3. ActionHandler Flexível**

O `actionHandler` já é flexível! Apenas precisa aceitar o novo tipo:

```typescript
// ✅ JÁ FUNCIONA: ActionOptions já é flexível
interface ActionOptions {
  actionType?: ActionType; // Agora aceita qualquer string
  entityName?: string;
}
```

### **4. Uso Simplificado**

#### **Agora Funciona Sem Mudanças Centrais**

```typescript
// ✅ NOVO: Reset de senha funciona imediatamente
export const resetUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetPasswordSchema,
    async (data, session) => {
      const service = container.get<UserService>('userService');
      return service.resetPassword(data, session.user.id);
    },
    rawData,
    { entityName: 'User', actionType: 'resetPassword' } // ✅ Funciona!
  );

// ✅ NOVO: Qualquer action customizada
export const approveContract = async (rawData: unknown) =>
  handleServerAction(
    approveContractSchema,
    async (data, session) => {
      const service = container.get<ContractService>('contractService');
      return service.approve(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Contract', actionType: 'approve' } // ✅ Funciona!
  );
```

---

## 🛠️ Melhorias para Table Actions

### **Problema Atual**

O `useTableColumnsWithActions` tem limitação no `customActions`:

```typescript
// ❌ LIMITADO: Apenas onEdit e onDelete fixos
interface UseTableColumnsWithActionsOptions<T> {
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => Promise<void> | void;
  // customActions está comentado! ❌
}
```

### **Solução: Reativar CustomActions**

```typescript
// ✅ MELHORADO: Suporte completo a customActions
interface UseTableColumnsWithActionsOptions<T> {
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => Promise<void> | void;
  customActions?: CustomAction<T>[]; // ✅ Reativado!
}

export function useTableColumnsWithActions<T>(
  baseColumns: TableColumnsType<T>,
  options: UseTableColumnsWithActionsOptions<T>
): TableColumnsType<T> {
  return [
    ...baseColumns,
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_, record) => (
        <TableActionButtons
          record={record}
          onEdit={options.onEdit}
          onDelete={options.onDelete}
          customActions={options.customActions} // ✅ Passa customActions
        />
      ),
    },
  ];
}
```

### **Exemplo: Reset de Senha na Tabela**

```typescript
// ✅ NOVO: Reset de senha como table action
const columns = useTableColumnsWithActions(
  baseColumns,
  {
    onEdit: controller.open,
    onDelete: (item) => controller.exec(() => deleteUser({ id: item.id })),
    customActions: [
      {
        key: 'reset-password',
        label: 'Reset Senha',
        icon: <LockOutlined />,
        type: 'link',
        confirm: {
          title: 'Reset de Senha',
          description: 'Uma nova senha será gerada. Continuar?',
          okText: 'Reset',
          cancelText: 'Cancelar'
        },
        onClick: (user) => handleResetPassword(user.id)
      }
    ]
  }
);
```

---

## 📚 Manual de Criação de ActionTypes

### **Passo 1: Criar a Action**

```typescript
// apps/web/src/lib/actions/user/resetPassword.ts
'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  userId: z.number().int().positive(),
  sendEmail: z.boolean().default(true),
});

export const resetUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetPasswordSchema,
    async (data, session) => {
      const service = container.get<UserService>('userService');
      return service.resetPassword(data, session.user.id);
    },
    rawData,
    { entityName: 'User', actionType: 'resetPassword' } // ✅ Qualquer string funciona
  );
```

### **Passo 2: Implementar no Service**

```typescript
// apps/web/src/lib/services/UserService.ts
async resetPassword(data: { userId: number, sendEmail: boolean }, currentUserId: string) {
  // Gera nova senha
  const newPassword = this.generateRandomPassword();
  const hashedPassword = await this.hashPassword(newPassword);

  // Atualiza no banco
  await this.userRepo.update(data.userId, { password: hashedPassword }, currentUserId);

  // Envia por email se solicitado
  if (data.sendEmail) {
    await this.sendPasswordResetEmail(data.userId, newPassword);
  }

  return { success: true, passwordSent: data.sendEmail };
}
```

### **Passo 3: Usar na Tabela (Opcional)**

```typescript
// apps/web/src/app/dashboard/usuario/page.tsx
const columns = useTableColumnsWithActions(
  baseColumns,
  {
    onEdit: controller.open,
    onDelete: (item) => controller.exec(() => deleteUser({ id: item.id })),
    customActions: [
      {
        key: 'reset-password',
        label: 'Reset',
        icon: <LockOutlined />,
        type: 'link',
        confirm: {
          title: 'Reset de Senha',
          description: 'Nova senha será enviada por email. Continuar?',
        },
        onClick: (user) =>
          controller.exec(
            () => resetUserPassword({ userId: user.id, sendEmail: true }),
            'Senha resetada e enviada por email!'
          )
      }
    ]
  }
);
```

### **Passo 4: Adicionar Label (Opcional)**

```typescript
// apps/web/src/lib/types/common.ts
export const ACTION_TYPE_LABELS: Record<string, string> = {
  // ... outros
  resetPassword: 'Reset de Senha',
  approve: 'Aprovação',
  reject: 'Rejeição',
  // Adicione conforme necessário
};
```

---

## ✅ Benefícios da Solução

### **1. Flexibilidade Total**

- ✅ Qualquer `ActionType` funciona imediatamente
- ✅ Sem alterações em arquivos centrais
- ✅ Sem risco de quebrar funcionalidades existentes

### **2. Desenvolvimento Ágil**

- ⚡ Actions específicas em minutos
- 🎯 Foco na lógica de negócio, não na infraestrutura
- 🔄 Iteração rápida de funcionalidades

### **3. Manutenibilidade**

- 📦 Código específico fica isolado
- 🧪 Testes focados na funcionalidade
- 📝 Documentação específica por action

### **4. Escalabilidade**

- 🚀 Sistema cresce sem limites artificiais
- 🏗️ Arquitetura suporta qualquer caso de uso
- 🔧 Extensibilidade sem refatoração

---

## 🎯 Implementação Recomendada

### **Ordem de Implementação**

1. **Atualizar tipos** → `common.ts` (5 min)
2. **Atualizar logger** → `logger.ts` (10 min)
3. **Corrigir hook** → `useTableColumnsWithActions.ts` (5 min)
4. **Testar com reset de senha** → Criar exemplo completo (30 min)
5. **Documentar** → Atualizar guias existentes (15 min)

### **Compatibilidade**

- ✅ **100% backward compatible**
- ✅ Actions existentes continuam funcionando
- ✅ Nenhuma alteração breaking
- ✅ Migração opcional e gradual

---

**🚀 Com essas mudanças, criar novos ActionTypes será tão simples quanto criar uma nova função! O
sistema se tornará verdadeiramente extensível e ágil.**
