# Guia de Permissões de Contrato - API Mobile

Este guia explica como usar o sistema estiloso de verificação de permissões de contrato implementado
na API.

## 🚀 Características Principais

### ✅ Tokens que Não Expiram

- Tokens JWT válidos até logout manual
- Sem necessidade de refresh tokens
- Ideal para aplicações mobile

### ✅ Sistema de Permissões Elegante

- Decorators intuitivos e expressivos
- Verificação automática de permissões
- Cache inteligente para performance
- Logging estruturado

## 📋 Decorators Disponíveis

### 1. Verificação Simples

```typescript
@RequireContractPermission('contratoId')
async getContractData(@Param('contratoId') contratoId: number) {}
```

### 2. Verificação Múltipla (Qualquer)

```typescript
@RequireAnyContractPermission('contratoIds')
async getMultipleContracts(@Body() body: { contratoIds: number[] }) {}
```

### 3. Verificação Múltipla (Todos)

```typescript
@RequireAllContractPermissions('contratoIds')
async getAllContracts(@Body() body: { contratoIds: number[] }) {}
```

### 4. Verificação Opcional

```typescript
@OptionalContractPermission('contratoId')
async getOptionalData(@Query('contratoId') contratoId?: number) {}
```

### 5. Listar Contratos do Usuário

```typescript
@GetUserContracts()
async getMyContracts(@GetUserContracts() contracts: ContractPermission[]) {
  return contracts;
}
```

## 🔧 Configuração Avançada

### Parâmetros Customizados

```typescript
@RequireContractPermission('contratoId', {
  bodyPath: 'data.contractId',  // Buscar no body em vez de params
  required: true,               // Obrigatório (padrão)
  mode: 'single'               // Modo de verificação
})
```

### Modos de Verificação

- `single`: Verifica permissão para um contrato específico
- `any`: Verifica permissão para qualquer um dos contratos
- `all`: Verifica permissão para todos os contratos

## 📱 Exemplos de Uso Mobile

### 1. Listar Contratos do Usuário

```bash
GET /contracts/meus-contratos
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "message": "Contratos do usuário obtidos com sucesso",
  "data": {
    "userId": 123,
    "contracts": [
      {
        "id": 1,
        "contratoId": 456,
        "contrato": {
          "id": 456,
          "nome": "Contrato ABC",
          "numero": "CTR-0456"
        }
      }
    ],
    "total": 1
  }
}
```

### 2. Acessar Contrato Específico

```bash
GET /contracts/456
Authorization: Bearer <token>
```

**Se tiver permissão:**

```json
{
  "message": "Contrato obtido com sucesso",
  "data": {
    "id": 456,
    "nome": "Contrato ABC",
    "numero": "CTR-0456",
    "descricao": "Descrição do contrato",
    "status": "ativo"
  }
}
```

**Se não tiver permissão:**

```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar este contrato"
}
```

### 3. Verificar Permissão

```bash
GET /contracts/verificar/456
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "hasPermission": true,
  "contratoId": 456,
  "userId": 123,
  "message": "Usuário tem permissão para este contrato"
}
```

## 🏗️ Implementação em Novos Controladores

### 1. Importar Dependências

```typescript
import {
  RequireContractPermission,
  GetUserContracts,
} from '../auth/decorator/contract-permission.decorator';
import { GetUsuarioMobileId } from '../auth/decorator/get-user-id-decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
```

### 2. Aplicar Guards e Decorators

```typescript
@Controller('meu-modulo')
@UseGuards(JwtAuthGuard)
export class MeuModuloController {
  @Get(':contratoId')
  @RequireContractPermission('contratoId')
  async getData(@Param('contratoId') contratoId: number, @GetUsuarioMobileId() userId: number) {
    // Sua lógica aqui
    // Se chegou até aqui, o usuário tem permissão
  }
}
```

## 🔄 Cache e Performance

O sistema inclui cache inteligente que:

- Cacheia permissões por 5 minutos
- Cacheia contratos do usuário por requisição
- Limpa cache automaticamente quando necessário
- Melhora performance significativamente

### Limpeza Manual do Cache

```typescript
// No serviço
contractPermissionsService.clearCache(); // Limpa tudo
contractPermissionsService.clearUserCache(userId); // Limpa usuário específico
```

## 🚨 Tratamento de Erros

### Erros Comuns

- **401 Unauthorized**: Token inválido ou usuário não autenticado
- **403 Forbidden**: Usuário não tem permissão para o contrato
- **400 Bad Request**: Parâmetro de contrato obrigatório não fornecido

### Logs Estruturados

O sistema gera logs detalhados para debugging:

```bash
[ContractPermissionsGuard] Acesso CONCEDIDO: usuário 123 tem permissão para contrato(s) 456
[ContractPermissionsService] Cache hit para permissão 123:456
```

## 🎯 Boas Práticas

### 1. Sempre Use Decorators

```typescript
// ✅ Bom
@RequireContractPermission('contratoId')
async getData(@Param('contratoId') contratoId: number) {}

// ❌ Evite verificação manual desnecessária
async getData(@Param('contratoId') contratoId: number) {
  const hasPermission = await this.service.hasPermission(userId, contratoId);
  if (!hasPermission) throw new ForbiddenException();
}
```

### 2. Use Cache Efetivamente

```typescript
// ✅ Bom - Cache automático
@GetUserContracts()
async getMyContracts(@GetUserContracts() contracts: ContractPermission[]) {
  return contracts; // Já vem do cache
}
```

### 3. Trate Erros Graciosamente

```typescript
// ✅ Bom - Decorator trata automaticamente
@RequireContractPermission('contratoId')
async getData(@Param('contratoId') contratoId: number) {
  // Se chegou aqui, tem permissão garantida
}
```

## 🔧 Configuração de Ambiente

### Variáveis Necessárias

```env
JWT_SECRET=sua_chave_secreta_aqui
```

### Banco de Dados

Certifique-se de que a tabela `MobileContratoPermissao` existe:

```sql
-- Verificar se a tabela existe
SELECT * FROM "MobileContratoPermissao" LIMIT 1;
```

## 📚 Recursos Adicionais

- **Swagger**: Documentação automática em `/api`
- **Logs**: Logs estruturados para debugging
- **Cache**: Performance otimizada
- **Type Safety**: TypeScript completo
- **Testes**: Fácil de testar com mocks

---

## 🎉 Conclusão

Este sistema oferece uma solução elegante e performática para verificação de permissões de contrato
em aplicações mobile, com:

- ✅ **Simplicidade**: Decorators intuitivos
- ✅ **Performance**: Cache inteligente
- ✅ **Flexibilidade**: Múltiplos modos de verificação
- ✅ **Segurança**: Tokens que não expiram
- ✅ **Manutenibilidade**: Código limpo e documentado

Use os decorators apropriados para cada cenário e aproveite a performance e segurança do sistema! 🚀
