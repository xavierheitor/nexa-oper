# Relatório de Segurança - Nexa Oper

## 📋 Resumo Executivo

Este relatório identifica vulnerabilidades de segurança conhecidas e potenciais no código do projeto
Nexa Oper. As vulnerabilidades foram classificadas por severidade e incluem recomendações de
correção.

**Data da Análise:** Janeiro 2025 **Escopo:** Aplicação Web (Next.js) e API (NestJS)

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. CORS Permissivo em Produção

**Severidade:** 🔴 CRÍTICA **Localização:** `apps/api/src/common/utils/cors.ts:9-10`

**Problema:**

```typescript
if (process.env.NODE_ENV === 'production') {
  return () => true; // ⚠️ PERMITE TODAS AS ORIGENS EM PRODUÇÃO!
}
```

**Impacto:**

- Qualquer site pode fazer requisições à API
- Risco de CSRF (Cross-Site Request Forgery)
- Exposição de dados sensíveis

**Recomendação:**

```typescript
if (process.env.NODE_ENV === 'production') {
  // NUNCA permitir todas as origens em produção
  throw new Error('CORS_ORIGINS deve ser configurado em produção');
}
```

---

### 2. Validação de Upload de Arquivos Insuficiente

**Severidade:** 🔴 CRÍTICA **Localização:**

- `apps/web/src/lib/utils/fileUpload.ts`
- `apps/api/src/modules/mobile-upload/services/mobile-photo-upload.service.ts`

**Problemas Identificados:**

1. **Validação apenas por MIME type (pode ser falsificado):**

```typescript
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  throw new Error('Tipo de arquivo não suportado');
}
```

2. **Extensão baseada no nome do arquivo (pode ser manipulada):**

```typescript
const extension = file.originalname.split('.').pop() || 'jpg';
```

1. **Falta validação de conteúdo real do arquivo (magic bytes)**

**Impacto:**

- Upload de arquivos maliciosos (malware, scripts)
- Path traversal attacks
- Armazenamento de conteúdo perigoso

**Recomendação:**

- Validar magic bytes do arquivo
- Usar biblioteca como `file-type` para detectar tipo real
- Sanitizar nomes de arquivo
- Validar extensão contra MIME type real

---

### 3. Falta de Rate Limiting Global

**Severidade:** 🟡 ALTA **Localização:** `apps/api/src/app.module.ts:186-188`

**Problema:** Rate limiting aplicado apenas na rota de login:

```typescript
consumer.apply(RateLimitMiddleware).forRoutes({ path: 'auth/login', method: RequestMethod.POST });
```

**Impacto:**

- Ataques de força bruta em outros endpoints
- DDoS (Denial of Service)
- Abuso de recursos

**Recomendação:**

- Aplicar rate limiting global com limites diferentes por endpoint
- Implementar rate limiting por IP e por usuário autenticado

---

## 🟡 VULNERABILIDADES ALTAS

### 4. Exposição de Informações Sensíveis em Logs

**Severidade:** 🟡 ALTA **Localização:** Múltiplos arquivos

**Problemas:**

- Logs podem conter dados sensíveis mesmo com sanitização
- Stack traces completos em produção podem expor estrutura interna

**Recomendação:**

- Revisar todos os logs para garantir sanitização adequada
- Implementar filtro de dados sensíveis mais robusto
- Não logar stack traces completos em produção

---

### 5. Content Security Policy Desabilitada

**Severidade:** 🟡 ALTA **Localização:** `apps/api/src/config/security.config.ts:30`

**Problema:**

```typescript
contentSecurityPolicy: false, // Desabilitado para não quebrar Swagger no dev
```

**Impacto:**

- Vulnerável a XSS (Cross-Site Scripting)
- Falta proteção contra code injection

**Recomendação:**

- Habilitar CSP em produção
- Configurar CSP adequadamente para Swagger apenas em desenvolvimento

---

### 6. Validação de Entrada Insuficiente

**Severidade:** 🟡 ALTA **Localização:** Múltiplos controllers

**Problemas:**

- Alguns endpoints não validam adequadamente entrada do usuário
- Falta sanitização de strings em alguns casos
- Validação de tipos pode ser contornada

**Recomendação:**

- Usar DTOs com validação robusta (class-validator)
- Implementar sanitização de strings
- Validar tipos e formatos de dados

---

### 7. JWT Token com Expiração Longa

**Severidade:** 🟡 MÉDIA **Localização:**
`apps/api/src/modules/engine/auth/services/auth.service.ts:112-113`

**Problema:**

```typescript
const accessTokenExpiresIn = '7d'; // Access token válido por 7 dias
const refreshTokenExpiresIn = '30d'; // Refresh token válido por 30 dias
```

**Impacto:**

- Tokens roubados permanecem válidos por muito tempo
- Janela de ataque ampliada

**Recomendação:**

- Reduzir expiração do access token para 15-30 minutos
- Manter refresh token com expiração maior, mas implementar revogação
- Implementar blacklist de tokens revogados

---

## 🟢 VULNERABILIDADES MÉDIAS

### 8. Falta de Headers de Segurança no Next.js

**Severidade:** 🟢 MÉDIA **Localização:** `apps/web/next.config.ts`

**Problema:** Não há configuração de headers de segurança no Next.js

**Recomendação:** Adicionar ao `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]
    }
  ];
}
```

---

### 9. Variáveis de Ambiente Expostas no Client-Side

**Severidade:** 🟢 MÉDIA **Localização:** Múltiplos arquivos usando `NEXT_PUBLIC_*`

**Problema:** Variáveis `NEXT_PUBLIC_*` são expostas no bundle do cliente

**Recomendação:**

- Revisar quais variáveis realmente precisam ser públicas
- Não expor URLs internas ou secrets
- Documentar quais variáveis são públicas

---

### 10. Falta de Validação de Tamanho de Request Body

**Severidade:** 🟢 MÉDIA **Localização:** `apps/api/src/config/app.config.ts`

**Problema:** Limites muito altos podem permitir ataques de DoS:

```typescript
jsonLimit: '50mb',
urlencodedLimit: '50mb',
```

**Recomendação:**

- Reduzir limites para valores mais razoáveis (ex: 10MB)
- Implementar validação por endpoint específico

---

## ✅ PONTOS POSITIVOS DE SEGURANÇA

1. ✅ **Autenticação JWT implementada corretamente**
2. ✅ **Senhas hasheadas com bcrypt**
3. ✅ **Validação de variáveis de ambiente com Joi**
4. ✅ **Sanitização de dados em logs**
5. ✅ **Helmet configurado (parcialmente)**
6. ✅ **Rate limiting no endpoint de login**
7. ✅ **Validação de arquivos (parcial)**
8. ✅ **Uso de Prisma (protege contra SQL Injection)**
9. ✅ **Guards de autenticação implementados**
10. ✅ **Soft delete implementado**

---

## 📝 RECOMENDAÇÕES PRIORITÁRIAS

### Prioridade 1 (Crítico - Corrigir Imediatamente)

1. **Corrigir CORS em produção** - Bloquear todas as origens se não configurado
2. **Melhorar validação de uploads** - Validar magic bytes e conteúdo real
3. **Implementar rate limiting global** - Proteger todos os endpoints

### Prioridade 2 (Alto - Corrigir em Breve)

4. **Habilitar CSP em produção** - Configurar adequadamente
5. **Reduzir expiração de tokens JWT** - Implementar refresh tokens adequadamente
6. **Revisar logs** - Garantir que não exponham dados sensíveis

### Prioridade 3 (Médio - Planejar)

7. **Adicionar headers de segurança no Next.js**
8. **Revisar variáveis públicas** - Minimizar exposição
9. **Reduzir limites de body parser** - Prevenir DoS

---

## 🔍 CHECKLIST DE SEGURANÇA

- [ ] CORS configurado corretamente em produção
- [ ] Uploads validados por magic bytes
- [ ] Rate limiting global implementado
- [ ] CSP habilitado em produção
- [ ] Tokens JWT com expiração adequada
- [ ] Headers de segurança configurados
- [ ] Logs não expõem dados sensíveis
- [ ] Validação de entrada robusta
- [ ] Variáveis de ambiente revisadas
- [ ] Dependências atualizadas (verificar vulnerabilidades conhecidas)

---

## 📚 REFERÊNCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

---

**Próximos Passos:**

1. Revisar e corrigir vulnerabilidades críticas
2. Implementar melhorias de segurança
3. Realizar testes de penetração
4. Configurar monitoramento de segurança
5. Estabelecer processo de revisão de segurança contínua
