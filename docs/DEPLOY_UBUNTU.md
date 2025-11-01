# 🚀 Guia de Deploy - Ubuntu Server

## 📋 Visão Geral

Este guia passo a passo cobre o deploy completo do Nexa Oper em um servidor Ubuntu, incluindo
configuração do banco de dados, aplicações (Web e API), Nginx como proxy reverso, e gerenciamento de
processos com PM2.

### **Arquitetura de Deploy**

```bash
Internet
  ↓
Nginx (porta 80/443)
  ├─→ Web App (Next.js) - porta 3000
  └─→ API (NestJS) - porta 3001
       └─→ MySQL/PostgreSQL
```

---

## 🔧 Pré-requisitos

### **1. Servidor Ubuntu**

```bash
# Verificar versão
lsb_release -a

# Recomendado: Ubuntu 20.04 LTS ou superior
```

### **2. Acesso ao Servidor**

```bash
# SSH no servidor
ssh usuario@seu-servidor-ip
```

### **3. Permissões**

```bash
# Verificar se tem sudo
sudo -l

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

---

## 📦 Parte 1: Instalação de Dependências

### **1.1 Node.js (v18+)**

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # deve ser v18.x ou superior
npm --version   # deve ser v9.x ou superior
```

### **1.2 MySQL ou PostgreSQL**

#### **Opção A: MySQL**

```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Segurança inicial
sudo mysql_secure_installation

# Entrar no MySQL
sudo mysql

# Criar usuário e banco
CREATE DATABASE nexa_oper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexa_user'@'localhost' IDENTIFIED BY 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON nexa_oper.* TO 'nexa_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Verificar conexão
mysql -u nexa_user -p nexa_oper
```

#### **Opção B: PostgreSQL**

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Criar usuário e banco
sudo -u postgres psql

CREATE DATABASE nexa_oper;
CREATE USER nexa_user WITH PASSWORD 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE nexa_oper TO nexa_user;
\q

# Verificar conexão
psql -U nexa_user -d nexa_oper -h localhost
```

### **1.3 Nginx**

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar serviço
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### **1.4 PM2 (Gerenciador de Processos)**

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup

# Seguir as instruções exibidas (copiar e colar o comando)
```

### **1.5 Certbot (SSL/HTTPS)**

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🔐 Parte 2: Configuração do Repositório

### **2.1 Clonar o Repositório**

```bash
# Criar diretório de aplicações
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/nexa-oper.git
cd nexa-oper

# Verificar estrutura
ls -la
```

### **2.2 Instalar Dependências**

```bash
# Na raiz do projeto
npm install
npm run install:all
```

---

## 🗄️ Parte 3: Configuração do Banco de Dados

### **3.1 Criar Arquivo .env**

```bash
# Criar .env na raiz (copiando do exemplo se existir)
cd /var/www/nexa-oper
cp .env.example .env  # ou criar manualmente

# Editar configurações
nano .env
```

### **3.2 Configurar DATABASE_URL**

#### **MySQL:**

```env
DATABASE_URL="mysql://nexa_user:sua_senha_segura_aqui@localhost:3306/nexa_oper"
```

#### **PostgreSQL:**

```env
DATABASE_URL="postgresql://nexa_user:sua_senha_segura_aqui@localhost:5432/nexa_oper"
```

### **3.3 Executar Migrações**

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate:deploy

# Verificar se deu certo
npm run db:studio  # opcional, para visualizar
```

---

## 🌐 Parte 4: Configuração da API

### **4.1 Criar .env da API**

```bash
# Criar .env específico da API
cd /var/www/nexa-oper/apps/api
nano .env
```

### **4.2 Configurar Variáveis da API**

```env
# Ambiente
NODE_ENV=production

# Porta
PORT=3001

# Banco (ja configurado na raiz, mas aqui também se necessário)
DATABASE_URL="mysql://nexa_user:sua_senha_segura_aqui@localhost:3306/nexa_oper"

# JWT Secret (gerar um aleatório seguro)
JWT_SECRET="seu_jwt_secret_muito_longo_e_seguro_deve_ter_32_caracteres_minimo"

# CORS - domínio do site
CORS_ORIGINS=https://seu-dominio.com

# Uploads (configurável)
UPLOAD_ROOT=/var/www/nexa-oper/uploads
UPLOAD_BASE_URL=https://storage.seu-dominio.com
```

### **4.3 Build da API**

```bash
# Build
cd /var/www/nexa-oper
npm run api:build

# Verificar dist
ls -la apps/api/dist
```

---

## 🎨 Parte 5: Configuração do Web

### **5.1 Criar .env do Web**

```bash
# Criar .env
cd /var/www/nexa-oper/apps/web
nano .env
```

### **5.2 Configurar Variáveis do Web**

```env
# NextAuth
NEXTAUTH_SECRET="o_mesmo_secret_do_jwt_ou_outro_secret_longo_e_seguro"
NEXTAUTH_URL=https://seu-dominio.com

# API
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com

# Database
DATABASE_URL="mysql://nexa_user:sua_senha_segura_aqui@localhost:3306/nexa_oper"

# App
NEXT_PUBLIC_APP_NAME="Nexa Oper"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Upload base URL (se usar subdomínio)
NEXT_PUBLIC_UPLOAD_BASE_URL=https://storage.seu-dominio.com
```

### **5.3 Build do Web**

```bash
# Build
cd /var/www/nexa-oper
npm run web:build

# Verificar .next
ls -la apps/web/.next
```

---

## 🚀 Parte 6: Configuração do PM2

### **6.1 Criar Arquivo de Configuração**

```bash
# Criar ecosystem.config.js na raiz
cd /var/www/nexa-oper
nano ecosystem.config.js
```

### **6.2 Conteúdo do ecosystem.config.js**

```javascript
module.exports = {
  apps: [
    {
      name: 'nexa-api',
      script: './apps/api/dist/main.js',
      cwd: '/var/www/nexa-oper',
      instances: 2, // Número de instâncias (processos)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/www/nexa-oper/logs/api-error.log',
      out_file: '/var/www/nexa-oper/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'nexa-web',
      script: './apps/web/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/nexa-oper/apps/web',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/nexa-oper/logs/web-error.log',
      out_file: '/var/www/nexa-oper/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

### **6.3 Criar Pasta de Logs**

```bash
mkdir -p /var/www/nexa-oper/logs
```

### **6.4 Iniciar Aplicações com PM2**

```bash
# Iniciar todas as apps
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs

# Salvar configuração atual
pm2 save
```

---

## 🌐 Parte 7: Configuração do Nginx

### **7.1 Criar Configuração do Site**

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/nexa-oper
```

### **7.2 Configuração do Nginx**

```nginx
# Redirecionamento HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com api.seu-dominio.com storage.seu-dominio.com;

    # Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Web App (Next.js)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com;

    # Certificados SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/nexa-web-access.log;
    error_log /var/log/nginx/nexa-web-error.log;

    # Proxy para Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API (NestJS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.seu-dominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;

    # Logs
    access_log /var/log/nginx/nexa-api-access.log;
    error_log /var/log/nginx/nexa-api-error.log;

    # Proxy para API
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout para uploads grandes
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Storage (Fotos - opcional, se usar subdomínio)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name storage.seu-dominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;

    # Logs
    access_log /var/log/nginx/nexa-storage-access.log;
    error_log /var/log/nginx/nexa-storage-error.log;

    # Servir arquivos estáticos
    root /var/www/nexa-oper/uploads;

    location /mobile/photos {
        alias /var/www/nexa-oper/uploads/mobile/photos;

        # Cache
        expires 30d;
        add_header Cache-Control "public, immutable";

        # Security
        add_header X-Content-Type-Options nosniff;
    }

    # Página inicial ou erro
    location / {
        return 404;
    }
}
```

### **7.3 Ativar Configuração**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/nexa-oper /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Parte 8: Configuração SSL/HTTPS

### **8.1 Obter Certificado SSL**

```bash
# Obter certificado (substitua email e domínio)
sudo certbot --nginx -d seu-dominio.com -d api.seu-dominio.com -d storage.seu-dominio.com

# Seguir as instruções interativas
# - Informar email
# - Aceitar termos
# - Escolher redirecionar HTTP para HTTPS
```

### **8.2 Renovação Automática**

```bash
# Testar renovação
sudo certbot renew --dry-run

# Certbot já está configurado em systemd timer
# Verificar
sudo systemctl status certbot.timer
```

---

## 📁 Parte 9: Configuração de Uploads

### **9.1 Criar Pasta de Uploads**

```bash
# Criar pasta
mkdir -p /var/www/nexa-oper/uploads/mobile/photos

# Definir permissões
sudo chown -R $USER:$USER /var/www/nexa-oper/uploads
chmod -R 755 /var/www/nexa-oper/uploads
```

### **9.2 Configurar Permissões no PM2**

Se necessário, ajustar owner nas configurações do PM2 para garantir acesso aos uploads.

---

## 🔍 Parte 10: Verificação e Testes

### **10.1 Verificar Status dos Serviços**

```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# MySQL
sudo systemctl status mysql
# ou PostgreSQL
sudo systemctl status postgresql
```

### **10.2 Verificar Logs**

```bash
# Logs PM2
pm2 logs

# Logs Nginx
sudo tail -f /var/log/nginx/nexa-web-error.log
sudo tail -f /var/log/nginx/nexa-api-error.log

# Logs da aplicação
tail -f /var/www/nexa-oper/logs/api-error.log
tail -f /var/www/nexa-oper/logs/web-error.log
```

### **10.3 Testar Endpoints**

```bash
# Health check da API
curl https://api.seu-dominio.com/api/health

# Página inicial do Web
curl https://seu-dominio.com

# Testar storage (se configurado)
curl https://storage.seu-dominio.com/mobile/photos/
```

---

## 🔄 Parte 11: Deploy de Atualizações

### **11.1 Script de Deploy**

Criar script `deploy.sh` na raiz:

```bash
#!/bin/bash

# Script de Deploy - Nexa Oper
set -e

echo "🚀 Iniciando deploy..."

# Ir para diretório do projeto
cd /var/www/nexa-oper

# Pull das últimas mudanças
echo "📥 Baixando atualizações..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install
npm run install:all

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
npm run db:generate

# Executar migrações
echo "🔄 Executando migrações..."
npm run db:migrate:deploy

# Build das aplicações
echo "🔨 Build das aplicações..."
npm run api:build
npm run web:build

# Reiniciar PM2
echo "♻️ Reiniciando aplicações..."
pm2 restart ecosystem.config.js

echo "✅ Deploy concluído!"

# Mostrar status
pm2 status

echo "📝 Verificar logs: pm2 logs"
```

### **11.2 Tornar Executável**

```bash
chmod +x deploy.sh
```

### **11.3 Executar Deploy**

```bash
./deploy.sh
```

---

## 🛠️ Parte 12: Comandos Úteis

### **12.1 Gerenciamento PM2**

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs

# Logs específicos
pm2 logs nexa-api
pm2 logs nexa-web

# Reiniciar
pm2 restart nexa-api
pm2 restart nexa-web
pm2 restart all

# Parar
pm2 stop nexa-api

# Deletar
pm2 delete nexa-api

# Informações detalhadas
pm2 info nexa-api

# Monitoramento
pm2 monit
```

### **12.2 Gerenciamento Nginx**

```bash
# Testar configuração
sudo nginx -t

# Recarregar (sem downtime)
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx
```

### **12.3 Gerenciamento Banco de Dados**

#### **MySQL:**

```bash
# Entrar no MySQL
mysql -u nexa_user -p nexa_oper

# Backup
mysqldump -u nexa_user -p nexa_oper > backup_$(date +%Y%m%d).sql

# Restore
mysql -u nexa_user -p nexa_oper < backup_20231201.sql
```

#### **PostgreSQL:**

```bash
# Backup
pg_dump -U nexa_user -d nexa_oper > backup_$(date +%Y%m%d).sql

# Restore
psql -U nexa_user -d nexa_oper < backup_20231201.sql
```

---

## 🔐 Parte 13: Segurança

### **13.1 Firewall (UFW)**

```bash
# Instalar UFW
sudo apt install ufw

# Permitir SSH (importante!)
sudo ufw allow OpenSSH

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### **13.2 Fail2Ban (Prevenção de Brute Force)**

```bash
# Instalar
sudo apt install fail2ban

# Configurar para SSH
sudo nano /etc/fail2ban/jail.local
```

Adicionar:

```ini
[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 5
bantime = 3600
```

```bash
# Reiniciar Fail2Ban
sudo systemctl restart fail2ban

# Verificar status
sudo fail2ban-client status sshd
```

### **13.3 Atualizações Automáticas**

```bash
# Instalar unattended-upgrades
sudo apt install unattended-upgrades

# Configurar
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Parte 14: Monitoramento

### **14.1 Configurar PM2 Plus (Opcional)**

```bash
# Registrar no PM2 Plus
pm2 link secret key aqui
```

### **14.2 Logs Rotativos**

```bash
# PM2 já faz rotação, mas podemos configurar
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🚨 Troubleshooting

### **Problema: Aplicações não iniciam**

```bash
# Verificar logs
pm2 logs --err

# Verificar se porta está livre
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 3001

# Verificar variáveis de ambiente
pm2 env 0  # para primeira app
```

### **Problema: Banco de dados não conecta**

```bash
# Testar conexão
mysql -u nexa_user -p nexa_oper
# ou
psql -U nexa_user -d nexa_oper

# Verificar DATABASE_URL nos .env
cat /var/www/nexa-oper/.env | grep DATABASE
```

### **Problema: Nginx retorna 502**

```bash
# Verificar se apps estão rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/nexa-web-error.log

# Verificar firewall
sudo ufw status
```

### **Problema: SSL não funciona**

```bash
# Renovar certificado
sudo certbot renew

# Verificar certificado
sudo certbot certificates
```

---

## 📝 Checklist Final

- [ ] Node.js v18+ instalado
- [ ] MySQL/PostgreSQL instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] PM2 instalado e configurado
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Banco criado e migrado
- [ ] Variáveis .env configuradas
- [ ] Build das aplicações executado
- [ ] PM2 rodando as apps
- [ ] Nginx configurado e ativo
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Uploads funcionando
- [ ] Deploy testado
- [ ] Logs verificados

---

## 🎉 Pronto!

Seu Nexa Oper está em produção! 🚀

### **Acessos:**

- **Web:** https://seu-dominio.com
- **API:** https://api.seu-dominio.com/api
- **API Docs:** https://api.seu-dominio.com/api/docs
- **Storage:** https://storage.seu-dominio.com

### **Comandos Principais:**

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Deploy atualização
./deploy.sh

# Backup banco
mysqldump -u nexa_user -p nexa_oper > backup.sql
```

---

## 📞 Suporte

Em caso de problemas, verificar:

1. **Logs PM2:** `pm2 logs`
2. **Logs Nginx:** `sudo tail -f /var/log/nginx/nexa-*-error.log`
3. **Status serviços:** `sudo systemctl status nginx mysql`
4. **Configuração:** Revisar todos os `.env` files
