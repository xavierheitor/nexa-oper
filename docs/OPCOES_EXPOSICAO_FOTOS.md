Opções para Exposição de Fotos - Análise

## 📸 Problema Atual

- **API** salva fotos em: `apps/api/uploads/mobile/photos/`
- **Web** precisa acessar essas fotos para exibir
- **Atualmente**: Web não consegue acessar as fotos ❌

---

## 🎯 Soluções Possíveis

### Opção 1: API Expõe Arquivos Estáticos ✅ RECOMENDADO

**Implementação:**

- Usar `ServeStaticModule` do NestJS
- Expor pasta `uploads` como arquivos estáticos
- URL: `http://api:3001/uploads/mobile/photos/turnoId/arquivo.jpg`

**Vantagens:**

- ✅ Simples de implementar
- ✅ Performance (sem processamento extra)
- ✅ Escalável com cache/CDN
- ✅ Banco compartilhado funciona
- ✅ Só uma localização de arquivos
- ✅ Web acessa diretamente

**Desvantagens:**

- ⚠️ API precisa servir arquivos (carga extra)
- ⚠️ Em produção, precisa servir arquivos grandes

**Código:**

```typescript
// apps/api/src/main.ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

// Servir arquivos estáticos
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

---

### Opção 2: Projeto Separado para Fotos 🏗️

**Implementação:**

- Criar novo app `packages/storage` ou `apps/storage`
- Servidor simples (Express) apenas para servir arquivos
- API salva fotos, Storage expõe
- URL: `http://storage:3002/uploads/...`

**Vantagens:**

- ✅ Separação de responsabilidades
- ✅ Escalável independentemente
- ✅ Pode usar nginx/CDN direto
- ✅ API não precisa servir arquivos

**Desvantagens:**

- ⚠️ Complexidade adicional (mais um serviço)
- ⚠️ Mais infraestrutura para gerenciar
- ⚠️ Overhead de comunicação
- ⚠️ Precisa de nova porta/domínio

**Estrutura:**

```bash
packages/
├── storage/           # Novo
│   ├── src/
│   │   └── serve-files.ts
│   └── package.json
```

---

### Opção 3: Web acessa pasta pública no monorepo 📁

**Implementação:**

- Criar `packages/storage/uploads/` na raiz
- API salva em `packages/storage/uploads/`
- Web serve essa mesma pasta
- Ambos acessam mesmo local

**Vantagens:**

- ✅ Simples (pasta compartilhada)
- ✅ Sem configuração extra
- ✅ Banco compartilhado funciona

**Desvantagens:**

- ❌ Funciona SOMENTE em desenvolvimento local
- ❌ Impossível em produção (containers separados)
- ❌ Problemas com permissões
- ❌ Não escalável

**Deve ser descartada para produção**

---

### Opção 4: Storage em Nuvem (S3/Azure Blob) ☁️

**Implementação:**

- Usar AWS S3 ou Azure Blob Storage
- API faz upload para cloud
- Web acessa URLs públicas do cloud
- URL: `https://storage.azure.net/container/photo.jpg`

**Vantagens:**

- ✅ Melhor para produção
- ✅ Escalável automaticamente
- ✅ CDN integrado
- ✅ Backup automático
- ✅ Múltiplas regiões

**Desvantagens:**

- ⚠️ Custo adicional ($ por GB)
- ⚠️ Dependência externa
- ⚠️ Mais complexo de configurar
- ⚠️ Overhead de upload

---

## 🏆 Recomendação

### Para DESENVOLVIMENTO

**Opção 1: API expõe arquivos estáticos**

```typescript
// apps/api/src/main.ts (adicionar)
const app = await NestFactory.create<NestExpressApplication>(AppModule);

// Servir uploads como arquivos estáticos
app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});

// Web acessa: http://localhost:3001/uploads/mobile/photos/...
```

**Por quê?**

- Simples e funciona imediatamente
- Web acessa direto via API
- Sem complexidade adicional
- Banco compartilhado funciona

### Para PRODUÇÃO

**Opção 4: Storage em Nuvem**

- Amazon S3
- Azure Blob Storage
- Google Cloud Storage

**Configuração opcional:**

```typescript
// Configuração para usar cloud storage
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

if (USE_CLOUD_STORAGE) {
  // Upload para S3/Blob
  // URLs públicas do cloud
} else {
  // Local: API serve arquivos
  app.useStaticAssets(...);
}
```

---

## 📊 Comparação Rápida

| Critério       | Opção 1 (API)  | Opção 2 (Storage) | Opção 3 (Pasta) | Opção 4 (Cloud) |
| -------------- | -------------- | ----------------- | --------------- | --------------- |
| Complexidade   | 🟢 Baixa       | 🟡 Média          | 🟢 Muito Baixa  | 🔴 Alta         |
| Dev            | ✅ Funciona    | ✅ Funciona       | ✅ Funciona     | ⚠️ Overhead     |
| Prod           | ⚠️ Carga extra | ✅ Escalável      | ❌ Não funciona | ✅ Ideal        |
| Custo          | 🟢 Grátis      | 🟢 Grátis         | 🟢 Grátis       | 🔴 $            |
| Performance    | 🟡 OK          | 🟢 Bom            | 🟡 OK           | 🟢 Excelente    |
| Escalabilidade | 🟡 Limitada    | 🟢 Boa            | ❌ Nenhuma      | 🟢 Ilimitada    |

---

## 🚀 Implementação Recomendada

### Fase 1: Desenvolvimento (AGORA)

Implementar **Opção 1** para funcionar imediatamente:

```typescript
// apps/api/src/main.ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

// Servir uploads como arquivos estáticos
app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});

logger.log('✅ Uploads estáticos disponíveis em /uploads/');
```

### Fase 2: Produção (DEPOIS)

Migrar para **Opção 4** com configuração híbrida:

```typescript
const storageType = process.env.STORAGE_TYPE || 'local';

if (storageType === 'cloud') {
  // Usar S3/Blob
} else {
  // Servir arquivos local
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
}
```

---

## 🎯 Decisão Final

**IMPLEMENTAR AGORA:** ✅ **Opção 1 - API serve arquivos estáticos**

**MIGRAR DEPOIS (produção):** ☁️ **Opção 4 - Storage em nuvem**

Isso permite:

1. Funcionamento imediato em desenvolvimento
2. Banco compartilhado funciona
3. Web acessa via API
4. Migração suave para cloud depois
