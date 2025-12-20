# Configuração de Timezone - Nexa Oper

## Problema

As datas estão sendo salvas com a timezone incorreta no banco de dados MySQL.

## Soluções Implementadas

### ✅ Solução 1: Configuração automática na API (Já implementado)

A API já configura automaticamente a timezone GMT-3 (Brasília) ao conectar ao banco de dados. Veja:
`apps/api/src/database/database.service.ts`

```typescript
await this.prisma.$executeRaw`SET time_zone = '-03:00'`;
```

### ✅ Solução 2: Configuração automática na Web (Já implementado)

A Web já configura automaticamente a timezone GMT-3 (Brasília) ao conectar ao banco de dados. Veja:
`apps/web/src/lib/db/db.service.ts`

```typescript
await this.prisma.$executeRaw`SET time_zone = '-03:00'`;
```

## Configurações Adicionais (Opcional)

### Configurar na DATABASE_URL (Alternativa)

Edite o arquivo `.env` na raiz do projeto e adicione o parâmetro `timezone`:

```env
# ANTES
DATABASE_URL="mysql://sympla:123456@69.62.95.28:3306/nexa_oper?connect_timeout=30&pool_timeout=30&socket_timeout=30"

# DEPOIS - Use offset GMT-3 ou configure no MySQL primeiro
DATABASE_URL="mysql://sympla:123456@69.62.95.28:3306/nexa_oper?connect_timeout=30&pool_timeout=30&socket_timeout=30"
```

**Importante**: Faça o mesmo no arquivo `apps/web/.env`

### Solução 2: Configurar no MySQL (Nível Global)

Execute no MySQL:

```sql
-- Configurar timezone global do servidor (offset GMT-3)
SET GLOBAL time_zone = '-03:00';

-- Ou se tiver tabelas de timezone instaladas:
SET GLOBAL time_zone = 'America/Sao_Paulo';

-- Verificar se foi configurado
SELECT @@global.time_zone, @@session.time_zone;
```

### Solução 3: Usar Script SQL

Execute o arquivo `configure_timezone.sql` no seu banco de dados:

```bash
mysql -u sympla -p -h 69.62.95.28 nexa_oper < configure_timezone.sql
```

## Código Implementado

### API (`apps/api/src/database/database.service.ts`)

- Configura timezone GMT-3 (`-03:00`) ao conectar ao banco

### Web (`apps/web/src/lib/db/db.service.ts`)

- Configura timezone GMT-3 (`-03:00`) ao conectar ao banco

## Verificação

Para verificar se a timezone está configurada corretamente:

```sql
-- No MySQL
SELECT NOW(), @@session.time_zone, @@global.time_zone;

-- Deve retornar a data/hora atual em horário de São Paulo
```

## Mais Informações

- Timezone do MySQL: <https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html>
- Prisma Timezone: <https://www.prisma.io/docs/concepts/components/prisma-client/timezone>
