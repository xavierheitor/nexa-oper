# Acesso via Rede Local - Mobile Dev

## ✅ Configurado

A API e Storage agora aceitam conexões de toda a rede local (não apenas localhost).

## 📱 Como Acessar do Mobile

### 1. Encontrar o IP do seu computador

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Exemplo: Seu IP é `192.168.1.200`

### 2. Configurar no Mobile

**API:**
```
http://192.168.1.200:3001/api
```

**Storage:**
```
http://192.168.1.200:3002
```

### 3. Verificar no Log

Quando iniciar a API, você verá:

```
🌐 Servidor rodando em 0.0.0.0:3001
🔗 URL local: http://localhost:3001/api
📱 Acesse da sua rede local: http://192.168.1.200:3001/api
```

## 🔧 Configuração

Por padrão, escutamos em `0.0.0.0` (aceita conexões de qualquer interface).

Para mudar o host:

**apps/api/.env**:
```env
HOST=0.0.0.0  # ou um IP específico, ou localhost
```

**apps/storage/env.example**:
```env
HOST=0.0.0.0
```

## 🔐 CORS

Verifique que os IPs da rede estão liberados no CORS:

**apps/api/.env**:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://192.168.1.200:3000
```

**apps/storage/env.example**:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://192.168.1.200:3000,http://192.168.1.200:3001
```

## ⚠️ Firewall

Se ainda não conseguir acessar, verifique o firewall do seu computador:

**macOS:**
- System Preferences → Security & Privacy → Firewall
- Permitir conexões para Node/API

**Linux:**
```bash
sudo ufw allow 3001
sudo ufw allow 3002
```

**Windows:**
- Windows Defender → Firewall
- Permitir Node.js nas portas 3001 e 3002

## 🧪 Testar

No seu mobile, no mesmo Wi-Fi:

```bash
# Testar API
curl http://192.168.1.200:3001/api/health

# Testar Storage
curl http://192.168.1.200:3002/health
```

## 📝 URLs Completas

- **API Base**: `http://192.168.1.200:3001/api`
- **Storage Photos**: `http://192.168.1.200:3002/photos`
- **Storage Upload**: `http://192.168.1.200:3002/upload`
- **API Docs**: `http://192.168.1.200:3001/api/docs`

