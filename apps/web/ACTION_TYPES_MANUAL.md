# 📖 Manual de ActionTypes Flexíveis - Nexa Oper

## 🎯 Visão Geral

Este manual ensina como criar novos `ActionTypes` de forma simples e flexível, sem precisar
modificar arquivos centrais do sistema. Após as melhorias implementadas, criar uma nova action
customizada é um processo rápido e seguro.

## 🚀 Sistema Flexível Implementado

### **Antes vs Depois**

#### **❌ Antes (Rígido)**

```typescript
// Precisava alterar 3+ arquivos centrais
export type ActionType = 'create' | 'update' | 'delete' | 'get' | 'list';
```

#### **✅ Depois (Flexível)**

```typescript
// Aceita qualquer string automaticamente
export type ActionType = BaseActionType | string;
```

### **Benefícios Implementados**

- ✅ **Zero modificação** em arquivos centrais
- ✅ **Qualquer string** funciona como ActionType
- ✅ **Logging automático** com labels amigáveis
- ✅ **CustomActions** funcionando nas tabelas
- ✅ **100% backward compatible**

---

## 📋 Passo a Passo: Criando um Novo ActionType

### **Exemplo Prático: Reset de Senha**

#### **Passo 1: Criar a Server Action**

```typescript
// apps/web/src/lib/actions/user/resetPassword.ts
'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  userId: z.number().int().positive(),
  sendEmail: z.boolean().default(true),
  notifyUser: z.boolean().default(true),
});

export const resetUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetPasswordSchema,
    async (data, session) => {
      const service = container.get<UserService>('userService');
      return service.resetPassword(data, session.user.id);
    },
    rawData,
    { entityName: 'User', actionType: 'resetPassword' } // ✅ Funciona automaticamente!
  );
```

#### **Passo 2: Implementar no Service**

```typescript
// apps/web/src/lib/services/UserService.ts
async resetPassword(
  data: { userId: number; sendEmail: boolean; notifyUser: boolean },
  currentUserId: string
) {
  // 1. Validar usuário existe
  const user = await this.userRepo.findById(data.userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // 2. Gerar nova senha segura
  const newPassword = this.generateRandomPassword();
  const hashedPassword = await this.hashPassword(newPassword);

  // 3. Atualizar no banco
  await this.userRepo.update(data.userId, { password: hashedPassword }, currentUserId);

  // 4. Enviar por email (se solicitado)
  if (data.sendEmail) {
    await this.sendPasswordResetEmail(user.email, newPassword);
  }

  return { success: true, emailSent: data.sendEmail };
}
```

#### **Passo 3: Usar na Interface**

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
        label: 'Reset Senha',
        icon: <LockOutlined />,
        type: 'link',
        confirm: {
          title: 'Reset de Senha',
          description: 'Nova senha será enviada por email. Continuar?',
          okText: 'Reset',
          cancelText: 'Cancelar'
        },
        onClick: (user) =>
          controller.exec(
            () => resetUserPassword({
              userId: user.id,
              sendEmail: true,
              notifyUser: true
            }),
            'Senha resetada com sucesso!'
          )
      }
    ]
  }
);
```

#### **Passo 4: Adicionar Label Amigável (Opcional)**

```typescript
// apps/web/src/lib/types/common.ts
export const ACTION_TYPE_LABELS: Record<string, string> = {
  // ... existentes
  resetPassword: 'Reset de Senha', // ✅ Aparece nos logs
  approveContract: 'Aprovação de Contrato',
  sendNotification: 'Envio de Notificação',
  // Adicione conforme necessário
};
```

---

## 🎨 Exemplos de ActionTypes Customizados

### **1. Aprovação de Contrato**

```typescript
// apps/web/src/lib/actions/contrato/approve.ts
export const approveContract = async (rawData: unknown) =>
  handleServerAction(
    z.object({
      contratoId: z.number().int().positive(),
      comments: z.string().optional()
    }),
    async (data, session) => {
      const service = container.get<ContratoService>('contratoService');
      return service.approve(data.contratoId, data.comments, session.user.id);
    },
    rawData,
    { entityName: 'Contrato', actionType: 'approve' } // ✅ Novo tipo
  );

// Uso na tabela
customActions: [
  {
    key: 'approve',
    label: 'Aprovar',
    icon: <CheckOutlined />,
    type: 'primary',
    confirm: {
      title: 'Aprovar Contrato',
      description: 'Tem certeza que deseja aprovar este contrato?'
    },
    onClick: (contrato) => handleApprove(contrato.id)
  }
]
```

### **2. Envio de Notificação**

```typescript
// apps/web/src/lib/actions/notification/send.ts
export const sendNotification = async (rawData: unknown) =>
  handleServerAction(
    z.object({
      userIds: z.array(z.number()),
      title: z.string(),
      message: z.string(),
      type: z.enum(['info', 'warning', 'error']),
    }),
    async (data, session) => {
      const service = container.get<NotificationService>('notificationService');
      return service.sendBulk(data, session.user.id);
    },
    rawData,
    { entityName: 'Notification', actionType: 'sendBulk' } // ✅ Novo tipo
  );
```

### **3. Clonagem de Entidade**

```typescript
// apps/web/src/lib/actions/veiculo/clone.ts
export const cloneVeiculo = async (rawData: unknown) =>
  handleServerAction(
    z.object({
      veiculoId: z.number().int().positive(),
      newPlaca: z.string().min(7).max(8)
    }),
    async (data, session) => {
      const service = container.get<VeiculoService>('veiculoService');
      return service.clone(data.veiculoId, data.newPlaca, session.user.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'clone' } // ✅ Novo tipo
  );

// Uso na tabela
customActions: [
  {
    key: 'clone',
    label: 'Clonar',
    icon: <CopyOutlined />,
    type: 'link',
    onClick: (veiculo) => handleClone(veiculo.id)
  }
]
```

---

## 🛠️ Padrões e Melhores Práticas

### **1. Nomenclatura de ActionTypes**

#### **✅ Boas Práticas**

```typescript
// Use verbos descritivos
'resetPassword'; // ✅ Claro e específico
'approveContract'; // ✅ Ação + entidade
'sendNotification'; // ✅ Verbo + substantivo
'exportData'; // ✅ Ação clara
'archiveEntity'; // ✅ Ação específica
```

#### **❌ Evitar**

```typescript
'reset'; // ❌ Muito genérico
'approve'; // ❌ Falta contexto
'send'; // ❌ Muito vago
'action1'; // ❌ Sem significado
'doSomething'; // ❌ Não descritivo
```

### **2. Estrutura de Schema**

#### **✅ Schema Bem Definido**

```typescript
const actionSchema = z.object({
  // IDs sempre validados
  entityId: z.number().int().positive('ID deve ser positivo'),

  // Opções com defaults sensatos
  sendEmail: z.boolean().default(true),
  notifyUser: z.boolean().default(false),

  // Strings com limites
  comments: z.string().max(500, 'Comentário muito longo').optional(),

  // Enums para opções limitadas
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
```

### **3. Implementação no Service**

#### **✅ Método Bem Estruturado**

```typescript
async customAction(data: ActionData, currentUserId: string) {
  // 1. Validações de negócio
  await this.validatePermissions(currentUserId);
  await this.validateEntityExists(data.entityId);

  // 2. Lógica principal
  const result = await this.executeMainLogic(data);

  // 3. Efeitos colaterais (emails, notificações, etc.)
  if (data.notifyUser) {
    await this.sendNotification(data.entityId, result);
  }

  // 4. Retorno padronizado
  return {
    success: true,
    data: result,
    message: 'Operação executada com sucesso'
  };
}
```

### **4. CustomActions na Tabela**

#### **✅ Configuração Completa**

```typescript
customActions: [
  {
    key: 'unique-action-key',           // ✅ Chave única
    label: 'Ação Clara',               // ✅ Label descritiva
    icon: <IconOutlined />,            // ✅ Ícone apropriado
    type: 'link',                      // ✅ Tipo adequado
    confirm: {                         // ✅ Confirmação quando necessário
      title: 'Confirmar Ação',
      description: 'Descrição clara da consequência',
      okText: 'Confirmar',
      cancelText: 'Cancelar'
    },
    onClick: (record) => handleAction(record) // ✅ Handler específico
  }
]
```

---

## 📊 Tipos de CustomActions Suportados

### **Tipos de Botão**

```typescript
type: 'default' | 'primary' | 'dashed' | 'link' | 'text';
```

### **Variações Visuais**

```typescript
{
  type: 'primary',    // Botão azul destacado
  danger: true        // Botão vermelho (perigoso)
}

{
  type: 'link',       // Link simples
  icon: <Icon />      // Com ícone
}

{
  type: 'text',       // Texto simples
  danger: false       // Cor normal
}
```

### **Confirmações Customizadas**

```typescript
confirm: {
  title: 'Título da Confirmação',
  description: 'Descrição detalhada do que vai acontecer',
  okText: 'Texto do Botão OK',
  cancelText: 'Texto do Botão Cancelar'
}
```

---

## 🔍 Debugging e Logs

### **Como Verificar se Está Funcionando**

#### **1. Verificar Logs**

```bash
# Ver logs da aplicação
tail -f apps/web/logs/app.log

# Procurar por seu ActionType
grep "resetPassword" apps/web/logs/app.log
```

#### **2. Exemplo de Log Gerado**

```json
{
  "level": "action",
  "message": "[RESET DE SENHA] User",
  "userId": "user123",
  "actionType": "resetPassword",
  "input": { "userId": 1, "sendEmail": true },
  "output": { "success": true, "emailSent": true },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

#### **3. Verificar no Console do Navegador**

```javascript
// Se houver erro, aparecerá no console
console.log('Action result:', result);
```

---

## 🧪 Testando Novos ActionTypes

### **1. Teste Manual**

1. Criar a action seguindo o padrão
2. Implementar no service
3. Adicionar na interface (botão ou customAction)
4. Testar na interface
5. Verificar logs

### **2. Teste Automatizado**

```typescript
// tests/actions/resetPassword.test.ts
describe('resetPassword', () => {
  it('should reset user password successfully', async () => {
    const result = await resetUserPassword({
      userId: 1,
      sendEmail: true,
      notifyUser: true,
    });

    expect(result.success).toBe(true);
    expect(result.data.emailSent).toBe(true);
  });
});
```

---

## 🎯 Casos de Uso Comuns

### **1. Ações de Status**

- `activateUser` / `deactivateUser`
- `approveContract` / `rejectContract`
- `publishPost` / `unpublishPost`

### **2. Ações de Comunicação**

- `sendNotification`
- `sendEmail`
- `sendSMS`

### **3. Ações de Dados**

- `exportData`
- `importData`
- `syncData`

### **4. Ações de Manutenção**

- `archiveEntity`
- `cloneEntity`
- `mergeEntities`

### **5. Ações de Segurança**

- `resetPassword`
- `lockAccount`
- `unlockAccount`

---

## ⚡ Criação Rápida - Template

### **Template de Action**

```typescript
// apps/web/src/lib/actions/[entity]/[action].ts
'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const [action]Schema = z.object({
  // Defina seu schema aqui
});

export const [actionName] = async (rawData: unknown) =>
  handleServerAction(
    [action]Schema,
    async (data, session) => {
      const service = container.get<[Entity]Service>('[entity]Service');
      return service.[methodName](data, session.user.id);
    },
    rawData,
    { entityName: '[Entity]', actionType: '[actionType]' }
  );
```

### **Template de Service Method**

```typescript
// apps/web/src/lib/services/[Entity]Service.ts
async [methodName](data: [DataType], currentUserId: string) {
  // 1. Validações
  // 2. Lógica principal
  // 3. Efeitos colaterais
  // 4. Retorno

  return { success: true, data: result };
}
```

### **Template de CustomAction**

```typescript
// Na página/componente
customActions: [
  {
    key: '[action-key]',
    label: '[Action Label]',
    icon: <[Icon]Outlined />,
    type: 'link',
    confirm: {
      title: '[Confirmation Title]',
      description: '[Confirmation Description]'
    },
    onClick: (record) =>
      controller.exec(
        () => [actionName]({ entityId: record.id }),
        '[Success Message]'
      )
  }
]
```

---

## 🎉 Conclusão

Com o sistema flexível implementado, criar novos `ActionTypes` é agora:

- ⚡ **Rápido**: Poucos minutos para implementar
- 🔒 **Seguro**: Sem risco de quebrar funcionalidades existentes
- 🎯 **Focado**: Concentre-se na lógica de negócio
- 📈 **Escalável**: Sistema cresce sem limitações artificiais
- 🧪 **Testável**: Cada action é isolada e testável

***Agora você pode criar qualquer action customizada que precisar! 🚀***
