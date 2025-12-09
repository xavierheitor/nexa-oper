# 🚀 Guia de Deploy para Produção

## 📋 Checklist Pré-Deploy

Antes de iniciar o deploy, certifique-se de que:

- [ ] Todos os testes passaram
- [ ] Build local foi concluído com sucesso
- [ ] Migration foi testada em ambiente de desenvolvimento
- [ ] Versões foram atualizadas nos `package.json`
- [ ] Tags foram criadas
- [ ] Código foi commitado e está no repositório remoto

---

## 🔄 Passo a Passo do Deploy

### 1️⃣ Preparação do Ambiente

```bash
# 1. Conectar ao servidor de produção
ssh usuario@servidor-producao

# 2. Navegar para o diretório do projeto
cd /caminho/para/nexa-oper

# 3. Verificar branch atual
git branch

# 4. Fazer backup do banco de dados (IMPORTANTE!)
# Execute o backup antes de qualquer alteração
mysqldump -u usuario -p nome_banco > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2️⃣ Atualizar Código do Repositório

```bash
# 1. Buscar as últimas alterações do repositório
git fetch origin

# 2. Verificar as tags disponíveis
git tag -l | grep -E "(v0.1.1|api-v0.0.2)"

# 3. Fazer checkout da branch principal (ou branch de produção)
git checkout main  # ou master, ou production

# 4. Fazer pull das alterações
git pull origin main

# 5. Verificar se as tags estão disponíveis
git tag -l | tail -5
```

### 3️⃣ Executar Migration do Banco de Dados

⚠️ **ATENÇÃO**: Esta é a etapa mais crítica. Execute com cuidado!

```bash
# 1. Verificar se a migration existe
ls -la packages/db/prisma/models/migrations/20251207200305_add_motorista_to_turno_eletricista/

# 2. Executar a migration
# Opção A: Usando npm (recomendado)
npm run db:migrate:deploy

# Opção B: Usando Prisma diretamente
cd packages/db
npx prisma migrate deploy
cd ../..

# 3. Verificar se a migration foi aplicada
# Conecte ao banco e verifique se a coluna existe:
mysql -u usuario -p nome_banco -e "DESCRIBE TurnoEletricistas;" | grep motorista
```

**Resultado esperado**: Deve aparecer a coluna `motorista` do tipo `tinyint(1)` com default `0`

### 4️⃣ Instalar Dependências

```bash
# 1. Instalar dependências atualizadas
npm run install:all

# 2. Gerar Prisma Client (se necessário)
npm run db:generate
```

### 5️⃣ Build das Aplicações

```bash
# 1. Limpar builds anteriores
npm run clean

# 2. Build da API
npm run api:build

# 3. Build do Web
npm run web:build

# 4. Verificar se os builds foram bem-sucedidos
ls -la apps/api/dist/main.js
ls -la apps/web/.next/BUILD_ID
```

### 6️⃣ Parar Aplicações em Execução

```bash
# 1. Parar aplicações usando PM2
pm2 stop nexa-api
pm2 stop nexa-web

# 2. Verificar se pararam
pm2 status
```

### 7️⃣ Iniciar Aplicações

```bash
# 1. Iniciar aplicações
pm2 start ecosystem.config.js

# 2. Verificar status
pm2 status

# 3. Verificar logs para erros
pm2 logs nexa-api --lines 50
pm2 logs nexa-web --lines 50
```

### 8️⃣ Verificações Pós-Deploy

```bash
# 1. Verificar se as aplicações estão respondendo
curl http://localhost:3001/health  # API
curl http://localhost:3000       # Web

# 2. Verificar logs em tempo real
pm2 logs --lines 100

# 3. Verificar uso de recursos
pm2 monit
```

### 9️⃣ Testes Funcionais

Após o deploy, teste as seguintes funcionalidades:

- [ ] **Login**: Acessar sistema e fazer login
- [ ] **Turnos**: Verificar se turnos estão sendo listados corretamente
- [ ] **Ícone de Motorista**: Verificar se aparece nas tabelas de Visão Geral e Histórico
- [ ] **Relatórios**:
  - [ ] Acessar "Turnos por Período"
  - [ ] Verificar se coluna "Motorista" aparece na exportação
  - [ ] Verificar se "KM de Abertura" aparece na exportação
  - [ ] Exportar para Excel e verificar formato
- [ ] **Abertura de Turno (Mobile)**:
  - [ ] Abrir turno via mobile
  - [ ] Verificar se campo motorista está sendo salvo
- [ ] **Justificativas**: Verificar se página de criar justificativa está funcionando

---

## 🔧 Comandos Úteis Durante o Deploy

### Ver logs em tempo real
```bash
pm2 logs --lines 200
```

### Reiniciar uma aplicação específica
```bash
pm2 restart nexa-api
pm2 restart nexa-web
```

### Ver status detalhado
```bash
pm2 describe nexa-api
pm2 describe nexa-web
```

### Rollback (se necessário)
```bash
# 1. Parar aplicações
pm2 stop all

# 2. Voltar para versão anterior
git checkout v0.1.0  # ou tag anterior
git pull origin main

# 3. Reverter migration (CUIDADO!)
# Conecte ao banco e execute:
# ALTER TABLE TurnoEletricistas DROP COLUMN motorista;

# 4. Rebuild e reiniciar
npm run build
pm2 restart all
```

---

## ⚠️ Problemas Comuns e Soluções

### Problema: Migration falha
**Solução**:
- Verificar se há conexão com o banco
- Verificar permissões do usuário do banco
- Verificar se a tabela existe

### Problema: Build falha
**Solução**:
- Verificar logs de erro
- Limpar node_modules e reinstalar: `npm run reset`
- Verificar se todas as dependências estão instaladas

### Problema: Aplicação não inicia
**Solução**:
- Verificar logs: `pm2 logs --err`
- Verificar variáveis de ambiente
- Verificar se a porta está disponível
- Verificar permissões de arquivos

### Problema: Campo motorista não aparece
**Solução**:
- Verificar se migration foi executada: `DESCRIBE TurnoEletricistas;`
- Verificar se Prisma Client foi regenerado: `npm run db:generate`
- Reiniciar aplicações: `pm2 restart all`

---

## 📝 Checklist Final

Após o deploy, confirme:

- [ ] Migration executada com sucesso
- [ ] Builds concluídos sem erros
- [ ] Aplicações iniciadas e rodando
- [ ] Logs sem erros críticos
- [ ] Funcionalidades testadas e funcionando
- [ ] Performance normal
- [ ] Backup do banco criado

---

## 🆘 Suporte

Em caso de problemas:

1. **Verificar logs**: `pm2 logs --lines 500`
2. **Verificar status**: `pm2 status`
3. **Verificar banco**: Conectar e verificar dados
4. **Rollback**: Seguir procedimento de rollback acima

---

## 📊 Resumo das Versões

- **Web**: `v0.1.1` → Campo Motorista e Melhorias nos Relatórios
- **API**: `api-v0.0.2` → Campo Motorista na Tabela TurnoEletricistas
- **Migration**: `20251207200305_add_motorista_to_turno_eletricista`

---

**Data do Deploy**: _______________
**Responsável**: _______________
**Status**: ☐ Sucesso | ☐ Com Problemas | ☐ Rollback

