# Configuração de Uploads - Fotos Mobile

## 📋 Variáveis de Ambiente

### `UPLOAD_ROOT` (Opcional)

**Descrição:** Caminho absoluto para o diretório onde as fotos serão armazenadas.

**Padrão:** `./uploads` (relativo ao diretório de execução)

**Exemplos:**

```bash
# Desenvolvimento local (padrão)
# Usa: ./uploads/mobile/photos

# Produção com pasta dedicada
UPLOAD_ROOT=/var/www/nexa-oper/storage

# Produção em servidor remoto via link simbólico
UPLOAD_ROOT=/mnt/nas/fotos-nexa
```

**Comportamento:**

- Se não configurada, usa caminho relativo: `./uploads/mobile/photos`
- Se configurada, o sistema adiciona `/mobile/photos` automaticamente
- Caminho final será: `{UPLOAD_ROOT}/mobile/photos`

### `UPLOAD_BASE_URL` (Opcional)

**Descrição:** URL pública completa para acesso às fotos (com ou sem trailing slash).

**Padrão:** `/uploads/mobile/photos` (relativo ao servidor da API)

**Exemplos:**

```bash
# Desenvolvimento local (padrão)
# Fotos acessíveis via: http://localhost:3001/uploads/mobile/photos/123/file.jpg

# Produção com subdomínio dedicado
UPLOAD_BASE_URL=https://storage.nexaoper.com.br

# Produção com CDN
UPLOAD_BASE_URL=https://cdn.nexaoper.com.br/uploads

# Produção com path customizado
UPLOAD_BASE_URL=https://api.nexaoper.com.br/fotos
```

**Importante:**

- Não inclua `/mobile/photos` na URL base, o sistema adiciona automaticamente
- Trailing slash será removido automaticamente
- URL final: `{UPLOAD_BASE_URL}/mobile/photos/{turnoId}/{arquivo}`

## 🔄 Fluxo de Armazenamento

```bash
1. Mobile envia foto → API
2. API valida checksum (idempotência)
3. API salva em: {UPLOAD_ROOT}/mobile/photos/{turnoId}/{timestamp}_{uuid}.{ext}
4. API retorna URL: {UPLOAD_BASE_URL}/mobile/photos/{turnoId}/{timestamp}_{uuid}.{ext}
5. Mobile/Web acessa foto pela URL retornada
```

## 🖥️ Configuração no Servidor

### Cenário 1: API e Web no mesmo servidor (Desenvolvimento)

```bash
# apps/api/.env
UPLOAD_ROOT=./uploads
# Deixe vazio ou não configure para usar padrão /uploads/mobile/photos
```

**Estrutura:**

```
projeto/
├── apps/
│   ├── api/
│   │   └── uploads/
│   │       └── mobile/
│   │           └── photos/
│   │               └── 123/
│   │                   └── arquivo.jpg
│   └── web/
└── packages/
```

### Cenário 2: Subdomínio dedicado (Produção Simples)

```bash
# apps/api/.env
UPLOAD_ROOT=/var/www/nexa-oper/storage
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

**Nginx config:**

```nginx
server {
    listen 443 ssl;
    server_name storage.nexaoper.com.br;

    # Servir arquivos estáticos
    location /mobile/photos {
        alias /var/www/nexa-oper/storage/mobile/photos;

        # Cache e headers
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Estrutura:**

```BASH
/var/www/nexa-oper/
├── storage/
│   └── mobile/
│       └── photos/
│           └── 123/
│               └── arquivo.jpg
```

### Cenário 3: Link simbólico para pasta compartilhada (Produção Avançada)

```bash
# apps/api/.env
UPLOAD_ROOT=/mnt/fotos-compartilhadas
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

**Setup do servidor:**

```bash
# Criar pasta compartilhada
sudo mkdir -p /mnt/fotos-compartilhadas

# Definir permissões
sudo chown -R www-data:www-data /mnt/fotos-compartilhadas

# Link simbólico (opcional, se precisar de compatibilidade)
ln -s /mnt/fotos-compartilhadas /var/www/nexa-oper/storage
```

**Nginx aponta para a mesma pasta:**

```nginx
server {
    listen 443 ssl;
    server_name storage.nexaoper.com.br;

    location /mobile/photos {
        alias /mnt/fotos-compartilhadas/mobile/photos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Estrutura:**

```
/mnt/fotos-compartilhadas/
└── mobile/
    └── photos/
        └── 123/
            └── arquivo.jpg
```

## 🔒 Segurança

### Permissões Recomendadas

```bash
# Apenas usuário da aplicação tem acesso
chmod 750 /var/www/nexa-oper/storage
chown www-data:www-data /var/www/nexa-oper/storage
```

### Nginx com Auth (Opcional)

```nginx
location /mobile/photos {
    alias /var/www/nexa-oper/storage/mobile/photos;

    # Autenticação básica (opcional)
    auth_basic "Fotos Privadas";
    auth_basic_user_file /etc/nginx/.htpasswd;

    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

## 🧪 Testes

### Verificar Configuração

```bash
# Ver logs da API ao salvar foto
tail -f apps/api/logs/app.log | grep UPLOAD

# Verificar pasta
ls -la /var/www/nexa-oper/storage/mobile/photos/

# Testar URL
curl https://storage.nexaoper.com.br/mobile/photos/123/test.jpg
```

## 📝 Exemplos de .env

### Desenvolvimento

```bash
# apps/api/.env
# Não configure nada, usa padrões:
# UPLOAD_ROOT -> ./uploads
# UPLOAD_BASE_URL -> /uploads/mobile/photos
```

### Staging

```bash
# apps/api/.env
UPLOAD_ROOT=/var/www/nexa-oper-staging/storage
UPLOAD_BASE_URL=https://storage-staging.nexaoper.com.br
```

### Produção

```bash
# apps/api/.env
UPLOAD_ROOT=/mnt/nas/nexa-oper-fotos
UPLOAD_BASE_URL=https://storage.nexaoper.com.br
```

## ⚠️ Troubleshooting

### Erro: "EACCES: permission denied"

```bash
# Verificar permissões
ls -la /var/www/nexa-oper/storage
# Ajustar dono
sudo chown -R www-data:www-data /var/www/nexa-oper/storage
```

### Erro: "ENOENT: no such file or directory"

```bash
# Criar pasta
mkdir -p /var/www/nexa-oper/storage/mobile/photos
```

### URLs não funcionando

```bash
# Verificar se UPLOAD_BASE_URL está configurada
echo $UPLOAD_BASE_URL

# Verificar logs da API
tail -f apps/api/logs/app.log | grep buildPublicUrl
```

## 🚀 Migração de Fotos Existentes

Se já tem fotos na estrutura antiga:

```bash
# Copiar fotos
cp -r apps/api/uploads /var/www/nexa-oper/storage

# Verificar
ls -la /var/www/nexa-oper/storage/mobile/photos/
```
