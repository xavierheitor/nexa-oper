# 🔴 REVISÃO CRÍTICA - API NEXA OPER (PRÉ-LANÇAMENTO)

**Data:** $(date) **Revisor:** Engenheiro Sênior (10 anos experiência) **Objetivo:** Identificação
de problemas críticos de segurança, manutenibilidade e qualidade antes do lançamento

---

## 📊 RESUMO EXECUTIVO

Esta revisão identificou **11 problemas críticos**, **8 problemas de alta prioridade** e **6
problemas de média prioridade** que devem ser corrigidos antes do lançamento em produção.

### 🚨 Classificação de Severidade

- **🔴 CRÍTICO:** Deve ser corrigido imediatamente antes do deploy
- **🟠 ALTA:** Deve ser corrigido antes do deploy, com alta prioridade
- **🟡 MÉDIA:** Deve ser corrigido em breve, mas não bloqueia deploy
- **🟢 BAIXA:** Melhorias recomendadas para o futuro

---

## 🔴 PROBLEMAS CRÍTICOS (DEVE CORRIGIR ANTES DO DEPLOY)

### 1. **JWT_SECRET com Fallback Inseguro** - CORRIGIDO

**Localização:**

- `apps/api/src/modules/engine/auth/auth.module.ts:16`
- `apps/api/src/modules/engine/auth/strategies/jwt.strategy.ts:53,58`

**Problema:**

```typescript
secret: process.env.JWT_SECRET || 'secret',  // ❌ FALLBACK PERIGOSO
secretOrKey: process.env.JWT_SECRET ||62 'secret',  // ❌ FALLBACK PERIGOSO
```

**Impacto:**

- Se `JWT_SECRET` não estiver definido, a aplicação usa `'secret'` como chave
- Qualquer pessoa com conhecimento pode gerar tokens JWT válidos
- Vulnerabilidade de segurança **EXTREMA**
- Em produção, pode permitir autenticação não autorizada

**Solução:**

```typescript
// Validar JWT_SECRET na inicialização
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'secret') {
  throw new Error('JWT_SECRET não pode estar vazio ou ser "secret". Configure no ambiente.');
}
```

**Prioridade:** 🔴 **CRÍTICA - BLOQUEADOR DE DEPLOY**

---

### 2. **Tokens JWT Sem Expiração** - CORRIGIDO

**Localização:**

- `apps/api/src/modules/engine/auth/services/auth.service.ts:108-114,180-187`
- `apps/api/src/modules/engine/auth/strategies/jwt.strategy.ts:50`

**Problema:**

- Tokens JWT são gerados sem expiração (`ignoreExpiration: true`)
- `expiresAt: null` em todos os tokens
- Tokens válidos indefinidamente até logout manual

**Impacto:**

- Se um token for comprometido, permanece válido até revogação manual
- Não há rotação automática de tokens
- Aumenta superfície de ataque
- Dificulta revogação em caso de vazamento

**Recomendação:**

- Implementar expiração de tokens (ex: 15 minutos para access, 7 dias para refresh)
- Implementar refresh token rotation
- Considerar token blacklist para revogação imediata

**Prioridade:** 🔴 **CRÍTICA - DEVE SER REVISADA**

---

### 3. **Exposição de Informações Sensíveis em Logs** - CORRIGIDO

**Localização:**

- `apps/api/src/common/middleware/logger.middleware.ts:97-102,116-121`
- `apps/api/src/modules/engine/auth/strategies/jwt.strategy.ts:56-59,88-89`

**Problema:**

```typescript
console.log('📥 Request:', {
  method,
  url: originalUrl,
  headers, // ❌ Expõe Authorization header com tokens JWT
  body, // ❌ Expõe senhas, dados pessoais, etc
});
```

**Impacto:**

- Tokens JWT são logados em texto plano
- Senhas podem aparecer nos logs
- Headers completos são expostos (incluindo cookies, tokens)
- Em produção, isso viola LGPD e pode comprometer segurança

**Solução:**

- Remover headers sensíveis antes de logar
- Sanitizar body removendo campos sensíveis (password, token, etc)
- Usar logger apropriado (não console.log) com níveis de log
- Desabilitar logs detalhados em produção

**Prioridade:** 🔴 **CRÍTICA - BLOQUEADOR DE DEPLOY**

---

### 4. **CORS Configurado com Placeholder em Produção** - CORRIGIDO

**Localização:**

- `apps/api/src/main.ts:169`

**Problema:**

```typescript
const corsOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://seu-dominio.com'] // ❌ TODO: Atualizar com domínio real
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
```

**Impacto:**

- CORS em produção permitirá apenas requisições de `seu-dominio.com`
- Frontend não conseguirá fazer requisições se não estiver nesse domínio
- Pode bloquear aplicação web em produção

**Solução:**

- Usar variável de ambiente `CORS_ORIGINS` com múltiplos domínios permitidos
- Validar que está configurado antes do deploy

**Prioridade:** 🔴 **CRÍTICA - BLOQUEADOR DE DEPLOY**

---

### 5. **Validação de Senha Muito Fraca** - IGNORADO

**Localização:**

- `apps/api/src/modules/engine/auth/dto/login.dto.ts:53`

**Problema:**

```typescript
@MinLength(3, { message: 'Senha deve ter pelo menos 3 caracteres' })
```

**Impacto:**

- Permite senhas de apenas 3 caracteres
- Facilita ataques de força bruta
- Não garante complexidade mínima

**Recomendação:**

- Mínimo 8 caracteres
- Adicionar validação de complexidade (maiúsculas, números, símbolos)
- Considerar política de senha mais rigorosa

**Prioridade:** 🔴 **CRÍTICA - DEVE SER REVISADA**

---

### 6. **Falta de Rate Limiting**

**Localização:**

- Nenhum arquivo encontrado implementando rate limiting

**Problema:**

- Não há proteção contra brute force attacks
- Não há limitação de requisições por IP/usuário
- Endpoints de login expostos a ataques de força bruta

**Impacto:**

- Ataques de força bruta em login
- DDoS facilitado
- Abuso de recursos do servidor

**Solução:**

- Implementar `@nestjs/throttler` ou `express-rate-limit`
- Aplicar rate limiting especialmente em `/auth/login`
- Considerar rate limiting por IP e por usuário

**Prioridade:** 🔴 **CRÍTICA - DEVE SER IMPLEMENTADO**

---

### 7. **Singleton Pattern Anti-pattern no DatabaseService**

**Localização:**

- `apps/api/src/database/database.service.ts:117-146`

**Problema:**

```typescript
let databaseServiceInstance: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService(); // ❌ Bypass do DI do NestJS
  }
  return databaseServiceInstance;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {...});
```

**Impacto:**

- Bypassa o sistema de Injeção de Dependências do NestJS
- Cria instância manual que não é gerenciada pelo NestJS
- Problemas com testes (mocks difíceis)
- Inconsistência de ciclo de vida (onModuleInit pode não ser chamado)
- Pode causar memory leaks

**Solução:**

- Remover singleton manual
- Usar apenas injeção de dependências do NestJS
- Se necessário acesso direto, exportar apenas o provider

**Prioridade:** 🔴 **CRÍTICA - DEVE SER REFATORADO**

---

### 8. **Console.log em Código de Produção**

**Localização:**

- Múltiplos arquivos com `console.log`/`console.error`

**Problema:**

- Uso de `console.log` em vez de Logger do NestJS
- Logs não estruturados
- Dificulta controle de nível de log em produção

**Impacto:**

- Logs sempre aparecem, independente do nível
- Não é possível filtrar/controlar logs em produção
- Performance reduzida (console.log é síncrono)

**Solução:**

- Substituir todos `console.log` por `Logger` do NestJS
- Usar níveis apropriados (log, debug, warn, error)

**Prioridade:** 🔴 **ALTA - DEVE SER CORRIGIDO**

---

### 9. **Timeout de Requisição Muito Alto (5 minutos)**

**Localização:**

- `apps/api/src/main.ts:182`

**Problema:**

```typescript
const timeoutMs = 300000; // 5 minutos
```

**Impacto:**

- Requisições podem ficar presas por 5 minutos
- Facilita ataques DoS (ocupar conexões por muito tempo)
- Má experiência do usuário

**Recomendação:**

- Reduzir para 30-60 segundos para maioria das requisições
- Usar timeouts específicos por endpoint se necessário
- Implementar timeouts diferentes para uploads

**Prioridade:** 🟠 **ALTA - DEVE SER REVISADO**

---

### 10. **Limite de Upload de 50MB Muito Generoso**

**Localização:**

- `apps/api/src/main.ts:162-163`

**Problema:**

```typescript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

**Impacto:**

- Pode facilitar ataques DoS (consumir memória do servidor)
- Uploads de 50MB podem travar o servidor se muitos simultâneos

**Recomendação:**

- Separar limite para uploads (15MB já está configurado no Multer)
- Reduzir limite de JSON/URL para 1-2MB
- Validar tamanho antes de processar

**Prioridade:** 🟠 **ALTA - DEVE SER REVISADO**

---

### 11. **Falta de Validação de JWT_SECRET na Inicialização**

**Localização:**

- `apps/api/src/main.ts` - não valida JWT_SECRET antes de iniciar

**Problema:**

- Aplicação pode iniciar sem JWT_SECRET válido
- Erro só aparece quando alguém tenta autenticar

**Solução:**

- Validar todas as variáveis de ambiente obrigatórias na inicialização
- Lançar erro e impedir inicialização se JWT_SECRET estiver ausente/inválido

**Prioridade:** 🔴 **CRÍTICA - DEVE SER IMPLEMENTADO**

---

## 🟠 PROBLEMAS DE ALTA PRIORIDADE

### 12. **Falta de Validação de Tipos MIME em Uploads**

**Localização:**

- `apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts`

**Problema:**

- Validação de MIME type pode ser burlada (arquivos podem ter extensão falsa)

**Recomendação:**

- Validar magic numbers dos arquivos (primeiros bytes)
- Usar biblioteca como `file-type` para validação real

**Prioridade:** 🟠 **ALTA**

---

### 13. **Logs Excessivos em Produção**

**Localização:**

- `apps/api/src/modules/engine/auth/guards/jwt-auth.guard.ts:52-60,82-89`
- `apps/api/src/modules/eletricista/services/eletricista.service.ts:667-708`

**Problema:**

- Logs de debug muito verbosos que aparecem em produção
- Performance impactada
- Logs podem crescer muito

**Recomendação:**

- Usar `logger.debug()` em vez de `logger.log()` para debug
- Desabilitar debug em produção

**Prioridade:** 🟠 **ALTA**

---

### 14. **Falta de Validação de Entrada em Alguns Endpoints**

**Localização:**

- Múltiplos controllers podem não ter validação completa

**Problema:**

- DTOs podem não validar todos os campos críticos
- Validação de tipos pode falhar silenciosamente

**Recomendação:**

- Revisar todos os DTOs
- Garantir que `ValidationPipe` está ativo em todas as rotas

**Prioridade:** 🟠 **ALTA**

---

### 15. **Query Raw SQL sem Validação de Input**

**Localização:**

- `apps/api/src/database/database.service.ts:54,107`

**Problema:**

```typescript
await this.prisma.$executeRaw`SET time_zone = '-03:00'`;
await this.prisma.$queryRaw`SELECT 1`;
```

**Status:** ✅ **OK** - Uso de template literals do Prisma previne SQL injection

**Observação:** Está correto, mas manter atenção se surgirem queries com variáveis

**Prioridade:** 🟢 **INFORMATIVO**

---

### 16. **TODO em Código de Produção**

**Localização:**

- `apps/api/src/app.module.ts:90`
- `apps/api/src/main.ts:169`
- `apps/api/src/modules/turno/services/checklist-preenchido.service.ts:197`

**Problema:**

- TODOs deixados no código podem indicar funcionalidades incompletas

**Prioridade:** 🟠 **MÉDIA - REVISAR ANTES DO DEPLOY**

---

### 17. **Falta de Helmet.js para Segurança HTTP**

**Localização:**

- Não encontrado

**Problema:**

- Headers de segurança HTTP não configurados (X-Frame-Options, CSP, etc)

**Recomendação:**

- Implementar `helmet` para adicionar headers de segurança

**Prioridade:** 🟠 **ALTA**

---

### 18. **Falta de Validação de Timezone Hardcoded**

**Localização:**

- `apps/api/src/database/database.service.ts:54`

**Problema:**

```typescript
await this.prisma.$executeRaw`SET time_zone = '-03:00'`; // Hardcoded
```

**Impacto:**

- Timezone fixo pode causar problemas em diferentes regiões
- Não considera horário de verão

**Recomendação:**

- Usar variável de ambiente `TZ` ou `TIMEZONE`

**Prioridade:** 🟠 **MÉDIA**

---

### 19. **Falta de Health Check Endpoint Público**

**Localização:**

- Verificar se existe `/health` ou `/api/health`

**Problema:**

- Load balancers e monitoramento precisam de health check

**Prioridade:** 🟠 **ALTA - VERIFICAR**

---

## 🟡 PROBLEMAS DE MÉDIA PRIORIDADE

### 20. **Falta de Testes de Integração**

**Localização:**

- Verificar cobertura de testes

**Problema:**

- Não foi possível verificar cobertura completa de testes

**Prioridade:** 🟡 **MÉDIA - VERIFICAR**

---

### 21. **Swagger Disponível em Produção**

**Localização:**

- `apps/api/src/main.ts:205-219`

**Problema:**

- Swagger está desabilitado em produção (✅取消了), mas verificar se realmente está desabilitado

**Prioridade:** 🟡 **VERIFICAR**

---

### 22. **Falta de Monitoring e Alerting**

**Localização:**

- Não encontrado

**Problema:**

- Sem monitoramento, difícil detectar problemas em produção

**Prioridade:** 🟡 **MÉDIA**

---

### 23. **Código Debug Deixado no Código**

**Localização:**

- `apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts:77,339,518,567-579,698`

**Problema:**

- Logs e comentários de debug podem indicar código não finalizado

**Prioridade:** 🟡 **MÉDIA - LIMPAR**

---

### 24. **Falta de Documentação de Variáveis de Ambiente**

**Localização:**

- Não encontrado arquivo `.env.example` ou documentação

**Problema:**

- Dificulta setup de novos ambientes

**Prioridade:** 🟡 **MÉDIA**

---

### 25. **Singleton Antipattern pode Causar Problemas em Testes**

**Localização:**

- `apps/api/src/database/database.service.ts`

**Problema:**

- Já mencionado no item 7, mas impacto em testes é específico

**Prioridade:** 🟡 **MÉDIA**

---

## 📋 CHECKLIST PRÉ-DEPLOY

Antes de fazer deploy em produção, garantir:

- [ ] **🔴 JWT_SECRET validado e obrigatório (não pode ser 'secret')**
- [ ] **🔴 CORS configurado com domínios corretos de produção**
- [ ] **🔴 Logs sensíveis removidos (headers, body com senhas/tokens)**
- [ ] **🔴 Rate limiting implementado (especialmente em /auth/login) Ongoing:**
- [ ] **🔴 Singleton pattern refatorado para usar apenas DI do NestJS**
- [ ] **🔴 Todos console.log substituídos por Logger do NestJS**
- [ ] **🔴 Validação de variáveis de ambiente na inicialização**
- [ ] **🟠 Helmet.js implementado para headers de segurança**
- [ ] **🟠 Timeout de requisições revisado (reduzir de 5min)**
- [ ] **🟠 Limite de upload revisado (separar JSON de uploads)**
- [ ] **🟠 Health check endpoint configurado**
- [ ] **🟠 Swagger desabilitado em produção (verificar)**
- [ ] **🟡 Código debug removido**
- [ ] **🟡 Documentação de variáveis de ambiente criada**

---

## 🎯 PRIORIZAÇÃO DE CORREÇÕES

### Fase 1 - BLOQUEADORES DE DEPLOY (Fazer Agora)

1. JWT_SECRET com fallback inseguro
2. CORS com placeholder
3. Logs expondo informações sensíveis
4. Validação de JWT_SECRET na inicialização

### Fase 2 - CRÍTICOS DE SEGURANÇA (Fazer Antes do Deploy)

5. Rate limiting
6. Singleton pattern refatorado
7. Console.log substituídos
8. Validação de senha reforçada

### Fase 3 - ALTA PRIORIDADE (Fazer Antes do Deploy)

9. Helmet.js
10. Timeout revisado
11. Limite de upload revisado
12. Health check

### Fase 4 - MELHORIAS (Pode Fazer Após Deploy)

13. Monitoring
14. Documentação
15. Limpeza de código debug

---

## 📝 OBSERVAÇÕES POSITIVAS

✅ **Uso correto de Prisma com template literals** (previne SQL injection) ✅ **Validação global de
DTOs configurada** ✅ **Filtro global de exceções implementado** ✅ **Uso de bcrypt para senhas** ✅
**Swagger desabilitado em produção** ✅ **Graceful shutdown implementado** ✅ **Documentação JSDoc
extensiva** ✅ **Uso de transações Prisma onde necessário**

---

## 🔗 REFERÊNCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**CONCLUSÃO:** Esta API possui uma boa base arquitetural, mas apresenta problemas críticos de
segurança que **DEVEM ser corrigidos antes do deploy em produção**. Os problemas mais críticos são
relacionados a JWT, logs e configuração de CORS.

**RECOMENDAÇÃO FINAL:** Não fazer deploy até que pelo menos os problemas marcados como **🔴
CRÍTICOS - BLOQUEADORES DE DEPLOY** sejam corrigidos.
