# Storage Service - Resumo da Implementação

## ✅ Implementado

### 1. Novo Serviço Storage (`apps/storage`)

- ✅ Servidor Express leve na porta 3002
- ✅ Prisma com banco separado `nexa_storage`
- ✅ Autenticação por chave (`X-Storage-Key`)
- ✅ Upload de fotos com idempotência (checksum SHA256)
- ✅ Servir arquivos estáticos (`GET /photos/*`)
- ✅ CORS configurado para Web e API
- ✅ Documentação completa

### 2. Integração com API

- ✅ `MobilePhotoUploadService` refatorado para proxy ao Storage
- ✅ Validações mantidas na API
- ✅ Processamento de pendências mantido
- ✅ Referências salvas no banco da API para rastreabilidade
- ⚠️ Dependências faltando: `form-data`, `node-fetch`

### 3. Integração com Web

- ✅ URLs apontam para Storage Service
- ✅ Variável de ambiente `STORAGE_SERVICE_URL`
- ✅ Fallback para URLs completas já existentes

### 4. Scripts Monorepo

- ✅ `npm run storage:dev`
- ✅ `npm run storage:build`
- ✅ `npm run storage:start`
- ✅ `npm run storage:generate`
- ✅ `npm run storage:migrate`

## 🔧 Próximos Passos

### 1. Instalar Dependências

```bash
# Storage
cd apps/storage && npm install

# API (dependências adicionais)
cd apps/api && npm install form-data node-fetch

# Reinstalar tudo
npm run install:all
```

### 2. Criar Banco de Dados

```sql
CREATE DATABASE nexa_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar Variáveis de Ambiente

**apps/storage/.env**:
```env
PORT=3002
STORAGE_KEY=nexa-storage-secret-key-2025
DATABASE_URL=mysql://root:password@localhost:3306/nexa_storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**apps/api/.env** (adicionar):
```env
STORAGE_SERVICE_URL=http://localhost:3002
STORAGE_SERVICE_KEY=nexa-storage-secret-key-2025
```

**apps/web/.env.local** (adicionar):
```env
STORAGE_SERVICE_URL=http://localhost:3002
```

### 4. Executar Migrações

```bash
npm run storage:generate
npm run storage:migrate
```

### 5. Testar

```bash
# Terminal 1: Storage
npm run storage:dev

# Terminal 2: API
npm run api:dev

# Terminal 3: Web
npm run web:dev
```

## 📊 Arquitetura

```
Mobile App
    ↓
API :3001
    ↓ (upload via proxy)
Storage :3002
    ↓
Banco: nexa_storage
Tabela: photos

Web :3000
    ↓ (visualização direta)
Storage :3002
    ↓
GET /photos/*
```

## 🔐 Autenticação

- **Storage** valida `X-Storage-Key` apenas em `/upload`
- `/photos/*` é público (sem auth)
- Chave configurada via `STORAGE_KEY` no `.env`

## 🗄️ Bancos de Dados

### `nexa_oper_dev` (API)
- Tabela `MobilePhotos` mantida para rastreabilidade
- Armazena referências para associação com checklists

### `nexa_storage` (Storage)
- Tabela `photos` com metadados completos
- Arquivos físicos em `apps/storage/uploads/`

## 📝 Endpoints

### Storage Service

- `GET /health` - Health check
- `POST /upload` - Upload de foto (protegido)
- `GET /photos/*` - Servir arquivos (público)

### API (mantém compatibilidade)

- `POST /api/mobile/uploads/photos` - Upload (proxy ao Storage)

## 🎯 Benefícios

1. **Separado**: Storage independente, pode escalar separadamente
2. **Simples**: Express leve, fácil de manter
3. **Seguro**: Auth por chave, CORS configurável
4. **Rastreável**: Referências na API para associação
5. **Idempotente**: Duplicatas detectadas automaticamente
6. **Produção-ready**: Estrutura preparada para deploy

## ⚠️ Observações

- Storage deve ser iniciado antes da API
- Mesma chave configurada em API e Storage
- URLs retornadas já incluem `http://localhost:3002`
- Banco separado não afeta API existente
- Processamento de pendências continua na API

