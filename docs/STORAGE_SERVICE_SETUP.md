# Setup do Storage Service

## 📦 Instalação

### 1. Instalar dependências do Storage

```bash
cd apps/storage
npm install
```

### 2. Instalar dependências adicionais na API

```bash
cd apps/api
npm install form-data node-fetch
```

### 3. Criar banco de dados

```sql
CREATE DATABASE nexa_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configurar variáveis de ambiente

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

### 5. Executar migrações do Storage

```bash
npm run storage:generate
npm run storage:migrate
```

### 6. Testar

```bash
# Terminal 1: Storage
npm run storage:dev

# Terminal 2: API
npm run api:dev

# Terminal 3: Web
npm run web:dev
```

## 🔄 Fluxo de Upload

1. **Mobile** → `POST /api/mobile/uploads/photos` (API)
2. **API** valida arquivo
3. **API** → `POST /upload` (Storage com X-Storage-Key)
4. **Storage** salva arquivo e registra no banco `nexa_storage`
5. **Storage** retorna URL
6. **API** salva referência no `nexa_oper_dev.MobilePhotos`
7. **API** processa pendências (se necessário)
8. **API** retorna URL para Mobile

## 👁️ Fluxo de Visualização

1. **Web** busca fotos do `nexa_oper_dev.MobilePhotos`
2. **Web** acessa foto via `GET http://localhost:3002/photos/...`
3. **Storage** serve arquivo diretamente

## ⚠️ Notas Importantes

- **Storage** usa banco separado `nexa_storage` com tabela `photos`
- **API** mantém tabela `MobilePhoto` para rastreabilidade
- URLs retornadas incluem prefixo do Storage Service
- Duplicatas são detectadas via checksum SHA256
- Auth simples via header `X-Storage-Key`

## 🐛 Troubleshooting

**Erro: "Storage service error"**
- Verifique se Storage está rodando na porta 3002
- Verifique `STORAGE_SERVICE_KEY` na API e Storage
- Verifique logs do Storage

**Erro: "Database connection failed"**
- Verifique `DATABASE_URL` no `.env` do Storage
- Verifique se banco `nexa_storage` existe

**Fotos não aparecem no Web**
- Verifique se URLs apontam para Storage (3002)
- Verifique CORS configurado corretamente
- Verifique arquivos em `apps/storage/uploads/`

## 📊 Estrutura

```
apps/storage/
├── prisma/
│   └── schema.prisma       # Modelo Photo
├── src/
│   ├── config/
│   │   └── env.ts          # Configurações
│   ├── middlewares/
│   │   ├── auth.ts         # Auth por chave
│   │   └── error-handler.ts
│   ├── routes/
│   │   ├── upload.ts       # POST /upload
│   │   └── static.ts       # GET /photos/*
│   ├── services/
│   │   ├── storage.service.ts
│   │   └── prisma.service.ts
│   └── server.ts           # Entry point
├── uploads/                # Arquivos salvos
└── .env                    # Configurações
```

## 🚀 Produção

- Use chave forte para `STORAGE_KEY`
- Configure HTTPS
- Monitore uso de disco em `uploads/`
- Configure backup do `nexa_storage`
- Use variáveis de ambiente seguras

