# Configuração Unificada de Uploads

## 📋 Visão Geral

Tanto o **Web** quanto a **API** estão configurados para usar a mesma pasta raiz de uploads, permitindo que todos os arquivos sejam armazenados em um único local e servidos por um domínio/configuração dedicada.

## 🔧 Variáveis de Ambiente

### `UPLOAD_ROOT` (Opcional)

**Descrição:** Caminho absoluto para o diretório raiz onde TODOS os uploads serão armazenados.

**Padrão:** `./uploads` (relativo ao diretório de execução)

**Exemplos:**

```bash
# Desenvolvimento local (padrão)
# Web salva em: ./uploads/justificativas/anexos
# API salva em: ./uploads/mobile/photos

# Produção com pasta dedicada compartilhada
UPLOAD_ROOT=/var/www/nexa-oper/storage

# Produção em servidor remoto via link simbólico
UPLOAD_ROOT=/mnt/nas/storage-nexa
```

**Estrutura de Pastas:**

Quando `UPLOAD_ROOT` está configurada, a estrutura será:

```
{UPLOAD_ROOT}/
├── mobile/
│   └── photos/
│       └── {turnoId}/
│           └── {arquivos}.jpg
├── justificativas/
│   └── anexos/
│       └── {justificativaId}/
│           └── {arquivos}.pdf
└── checklists/ (se implementado)
    └── {turnoId}/
        └── {arquivos}.jpg
```

### `UPLOAD_BASE_URL` (Opcional)

**Descrição:** URL pública completa para acesso aos uploads (com ou sem trailing slash).

**Padrão:** Path relativo (servido pela própria aplicação)

**Exemplos:**

```bash
# Desenvolvimento local (padrão)
# Fotos acessíveis via: http://localhost:3001/uploads/mobile/photos/123/file.jpg
# Anexos acessíveis via: http://localhost:3000/uploads/justificativas/anexos/1/file.pdf

# Produção com subdomínio dedicado
UPLOAD_BASE_URL=https://storage.nexaoper.com.br

# Produção com CDN
UPLOAD_BASE_URL=https://cdn.nexaoper.com.br
```

**Comportamento:**

- Se configurada, todas as URLs serão construídas como: `{UPLOAD_BASE_URL}/mobile/photos/...` ou `{UPLOAD_BASE_URL}/justificativas/anexos/...`
- Se não configurada, usa paths relativos que serão servidos pela própria aplicação

## 📁 Estrutura de Armazenamento

### API (NestJS)

**Fotos Mobile:**
- Caminho no servidor: `{UPLOAD_ROOT}/mobile/photos/{turnoId}/{timestamp}_{uuid}.{ext}`
- URL pública: `{UPLOAD_BASE_URL}/mobile/photos/{turnoId}/{arquivo}` ou `/uploads/mobile/photos/{turnoId}/{arquivo}`

### Web (Next.js)

**Anexos de Justificativas:**
- Caminho no servidor: `{UPLOAD_ROOT}/justificativas/anexos/{justificativaId}/{timestamp}_{uuid}.{ext}`
- URL pública: `{UPLOAD_BASE_URL}/justificativas/anexos/{justificativaId}/{arquivo}` ou `/uploads/justificativas/anexos/{justificativaId}/{arquivo}`

## 🔄 Fluxo de Armazenamento

### Fotos Mobile (API)

```bash
1. Mobile envia foto → API (/api/mobile/uploads/photos)
2. API valida checksum (idempotência)
3. API salva em: {UPLOAD_ROOT}/mobile/photos/{turnoId}/{timestamp}_{uuid}.{ext}
4. API retorna URL: {UPLOAD_BASE_URL}/mobile/photos/{turnoId}/{arquivo}
5. Mobile/Web acessa foto pela URL retornada
```

### Anexos de Justificativas (Web)

```bash
1. Web envia arquivo → Server Action (uploadAnexoJustificativa)
2. Web valida tipo e tamanho
3. Web salva em: {UPLOAD_ROOT}/justificativas/anexos/{justificativaId}/{timestamp}_{uuid}.{ext}
4. Web cria registro no banco via Prisma
5. Web retorna URL: {UPLOAD_BASE_URL}/justificativas/anexos/{justificativaId}/{arquivo}
```

## 🖥️ Configuração no Servidor

### Cenário 1: API e Web no mesmo servidor (Desenvolvimento)

**Estrutura:**
```
projeto/
├── apps/
│   ├── api/
│   │   └── .env
│   └── web/
│       └── .env
└── uploads/  (ou {UPLOAD_ROOT} se configurada)
    ├── mobile/
    │   └── photos/
    └── justificativas/
        └── anexos/
```

**Configuração:**

```bash
# apps/api/.env
UPLOAD_ROOT=./uploads  # ou deixe vazio para usar padrão
UPLOAD_BASE_URL=  # deixe vazio para usar paths relativos

# apps/web/.env
UPLOAD_ROOT=./uploads  # ou deixe vazio para usar padrão
UPLOAD_BASE_URL=  # deixe vazio para usar paths relativos
```

### Cenário 2: Pasta Compartilhada (Produção)

**Configuração:**

```bash
# apps/api/.env
UPLOAD_ROOT=/var/www/nexa-oper/storage
UPLOAD_BASE_URL=https://storage.nexaoper.com.br

# apps/web/.env
UPLOAD_ROOT=/var/www/nexa-oper/storage
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

**Nginx config para servir arquivos:**

```nginx
server {
    listen 443 ssl;
    server_name storage.nexaoper.com.br;

    # Servir fotos mobile
    location /mobile/photos {
        alias /var/www/nexa-oper/storage/mobile/photos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Servir anexos de justificativas
    location /justificativas/anexos {
        alias /var/www/nexa-oper/storage/justificativas/anexos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Estrutura no servidor:**

```
/var/www/nexa-oper/
├── storage/  (UPLOAD_ROOT)
│   ├── mobile/
│   │   └── photos/
│   │       └── 123/
│   │           └── arquivo.jpg
│   └── justificativas/
│       └── anexos/
│           └── 1/
│               └── arquivo.pdf
├── apps/
│   ├── api/
│   └── web/
```

### Cenário 3: Link Simbólico para Pasta Compartilhada (Produção Avançada)

```bash
# Criar pasta compartilhada
sudo mkdir -p /mnt/storage-compartilhada

# Definir permissões
sudo chown -R www-data:www-data /mnt/storage-compartilhada

# Configurar envs
# apps/api/.env
UPLOAD_ROOT=/mnt/storage-compartilhada
UPLOAD_BASE_URL=https://storage.nexaoper.com.br

# apps/web/.env
UPLOAD_ROOT=/mnt/storage-compartilhada
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

**Nginx aponta para a mesma pasta:**

```nginx
server {
    listen 443 ssl;
    server_name storage.nexaoper.com.br;

    location /mobile/photos {
        alias /mnt/storage-compartilhada/mobile/photos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /justificativas/anexos {
        alias /mnt/storage-compartilhada/justificativas/anexos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## ✅ Checklist de Configuração

- [ ] Configurar `UPLOAD_ROOT` no `.env` da API (se necessário)
- [ ] Configurar `UPLOAD_ROOT` no `.env` do Web (se necessário)
- [ ] Configurar `UPLOAD_BASE_URL` no `.env` da API (se usar domínio dedicado)
- [ ] Configurar `UPLOAD_BASE_URL` no `.env` do Web (se usar domínio dedicado)
- [ ] Criar pasta de uploads no servidor (se não usar padrão)
- [ ] Definir permissões corretas na pasta de uploads
- [ ] Configurar Nginx/Apache para servir arquivos (se usar domínio dedicado)
- [ ] Testar upload de fotos mobile (API)
- [ ] Testar upload de anexos de justificativas (Web)
- [ ] Verificar acesso aos arquivos via URL pública

## 📝 Notas Importantes

1. **Mesma Pasta Raiz:** Tanto API quanto Web devem usar o mesmo valor de `UPLOAD_ROOT` para que ambos salvem na mesma estrutura de pastas.

2. **URLs Públicas:** Se `UPLOAD_BASE_URL` estiver configurada, ambas as aplicações construirão URLs usando esse domínio. Caso contrário, cada uma servirá seus próprios arquivos.

3. **Permissões:** A pasta de uploads deve ter permissões de escrita para o usuário que executa as aplicações (geralmente `www-data` ou `node`).

4. **Backup:** A pasta de uploads deve estar incluída no plano de backup, pois contém arquivos importantes do sistema.

5. **Segurança:** Se usar domínio dedicado para servir arquivos, configure autenticação/autorização conforme necessário.

