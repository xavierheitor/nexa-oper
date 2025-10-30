# Storage Service

Serviço independente para gerenciamento de fotos e assinaturas do aplicativo mobile.

## 🎯 Arquitetura

```bash
Mobile → API :3001 → Storage :3002 (upload)
Web :3000 → Storage :3002 (visualização)
```

- **Porta**: 3002
- **Auth**: Header `X-Storage-Key` (simples, sem JWT)
- **Banco**: `nexa_storage` (separado do `nexa_oper_dev`)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas configurações

# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate
```

## 🚀 Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## 📝 Endpoints

### POST /upload

Upload de foto (protegido por X-Storage-Key)

**Headers:**

```bash
X-Storage-Key: sua-chave-secreta
Content-Type: multipart/form-data
```

**Payload:**

```javascript
{
  file: File,              // Arquivo da foto
  turnoId: number,         // ID do turno
  tipo: string,            // checklistReprova, assinatura, servico, etc
  checklistUuid?: string,  // UUID do checklist (opcional)
  checklistPerguntaId?: number,  // ID da pergunta (opcional)
  sequenciaAssinatura?: number,  // Sequência da assinatura (opcional)
  servicoId?: number       // ID do serviço (opcional)
}
```

**Resposta:**

```javascript
{
  status: 'stored' | 'duplicate',
  url: '/photos/mobile/photos/123/file.jpg',
  checksum: 'sha256_checksum'
}
```

### GET /photos/\*

Acesso público às fotos armazenadas

**Exemplo:**

```link
GET http://localhost:3002/photos/mobile/photos/123/file.jpg
```

### GET /health

Health check do serviço

**Resposta:**

```javascript
{
  status: 'ok',
  service: 'storage'
}
```

## 🔐 Autenticação

O Storage Service usa autenticação simples via header:

```
X-Storage-Key: sua-chave-secreta-aqui
```

Configure a chave no arquivo `.env`:

```env
STORAGE_KEY=sua-chave-secreta-aqui
```

## 🗄️ Banco de Dados

### Criar banco

```sql
CREATE DATABASE nexa_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Configuração

```env
DATABASE_URL=mysql://user:password@localhost:3306/nexa_storage
```

### Estrutura

A tabela `photos` mantém IDs de referência para associação com checklists na API:

- `turnoId`: ID do turno
- `checklistUuid`: UUID do checklist preenchido
- `checklistPerguntaId`: ID da pergunta
- `tipo`: Tipo da foto (checklistReprova, assinatura, etc)
- `checksum`: SHA256 para detectar duplicatas
- `url`: URL pública para acesso

## 🔄 Fluxo de Upload

1. **Mobile** envia foto para **API** (`POST /api/mobile/uploads/photos`)
2. **API** valida e autentica com **Storage** (`POST /upload` com `X-Storage-Key`)
3. **Storage** calcula checksum, verifica duplicatas
4. **Storage** salva arquivo em disco e registra no banco
5. **Storage** retorna URL pública
6. **API** processa pendências (se necessário)
7. **API** retorna URL para **Mobile**

## 👁️ Fluxo de Visualização

1. **Web** acessa foto via **Storage** (`GET /photos/mobile/photos/123/file.jpg`)
2. **Storage** serve arquivo diretamente (sem auth)

## 🛠️ Scripts

- `dev`: Inicia em modo desenvolvimento com hot-reload
- `build`: Compila TypeScript para JavaScript
- `start`: Inicia versão compilada
- `prisma:generate`: Gera Prisma Client
- `prisma:migrate`: Executa migrações
- `prisma:studio`: Abre Prisma Studio

## 🔧 Variáveis de Ambiente

```env
# Porta do serviço
PORT=3002

# Chave de autenticação
STORAGE_KEY=sua-chave-secreta-aqui

# Banco de dados
DATABASE_URL=mysql://user:password@localhost:3306/nexa_storage

# Diretório de uploads
UPLOAD_DIR=./uploads

# Tamanho máximo de arquivo (bytes)
MAX_FILE_SIZE=10485760

# CORS: origens permitidas
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🚀 Produção

- Configure `STORAGE_KEY` com chave forte
- Use HTTPS em produção
- Configure CORS com origens válidas
- Monitore uso de disco
- Configure backup do banco `nexa_storage`

## 📊 Monitoramento

- Health check: `GET /health`
- Logs: stdout/stderr
- Banco: Prisma Studio ou query direta

## 🔗 Integração

### API

Configure no `.env` da API:

```env
STORAGE_SERVICE_URL=http://localhost:3002
STORAGE_SERVICE_KEY=sua-chave-secreta-aqui
```

### Web

Configure no `.env.local` do Web:

```env
STORAGE_SERVICE_URL=http://localhost:3002
```

## 📝 Notas

- Idempotência garantida via checksum SHA256
- Duplicatas detectadas automaticamente
- Banco separado para independência total
- Arquivos físicos em `./uploads/`
- Suporte a JPEG, PNG, WebP, HEIC, HEIF
