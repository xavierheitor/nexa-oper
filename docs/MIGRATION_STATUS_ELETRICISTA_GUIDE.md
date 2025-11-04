# 🚀 Guia de Migration: Sistema de Status de Eletricistas

Este guia explica como criar a migration usando Prisma e popular os dados iniciais para todos os
eletricistas existentes.

## 📋 Pré-requisitos

1. ✅ Modelos Prisma criados (`eletricista-status.prisma`)
2. ✅ Modelo `Eletricista` atualizado com relacionamentos
3. ✅ Schema Prisma incluindo o novo arquivo

---

## 🔧 Passo 1: Verificar Schema Prisma

Certifique-se de que o arquivo `schema.prisma` ou os modelos estão sendo incluídos corretamente. O
Prisma deve detectar automaticamente os novos modelos.

---

## 📦 Passo 2: Criar a Migration

Execute o comando do Prisma para criar a migration:

```bash
cd packages/db
npm run migrate:dev -- --name add_eletricista_status
```

Ou se estiver usando o Prisma CLI diretamente:

```bash
cd packages/db
npx prisma migrate dev --name add_eletricista_status
```

O Prisma vai:

1. ✅ Detectar as mudanças nos modelos
2. ✅ Gerar a migration SQL automaticamente
3. ✅ Aplicar a migration no banco de desenvolvimento
4. ✅ Gerar o cliente Prisma atualizado

---

## 🔄 Passo 3: Popular Dados Iniciais (Eletricistas Existentes)

Após a migration, precisamos criar um script para popular os dados iniciais. Vou criar um script que
você pode executar.

### Opção A: Script Node.js (Recomendado)

Crie um arquivo `packages/db/scripts/seed-status-inicial.ts`:

```typescript
import { PrismaClient, StatusEletricista } from '../generated/prisma';

const prisma = new PrismaClient();

async function seedStatusInicial() {
  console.log('🌱 Iniciando seed de status inicial...');

  try {
    // Buscar todos os eletricistas que não têm status
    const eletricistasSemStatus = await prisma.eletricista.findMany({
      where: {
        Status: null,
        deletedAt: null, // Apenas não deletados
      },
      select: {
        id: true,
        nome: true,
        createdBy: true,
        createdAt: true,
      },
    });

    console.log(`📊 Encontrados ${eletricistasSemStatus.length} eletricistas sem status`);

    if (eletricistasSemStatus.length === 0) {
      console.log('✅ Todos os eletricistas já têm status. Nada a fazer.');
      return;
    }

    // Criar status inicial para cada eletricista
    for (const eletricista of eletricistasSemStatus) {
      const agora = new Date();
      const createdBy = eletricista.createdBy || 'system';

      // Criar status atual
      await prisma.eletricistaStatus.create({
        data: {
          eletricistaId: eletricista.id,
          status: StatusEletricista.ATIVO,
          dataInicio: eletricista.createdAt || agora,
          motivo: 'Status inicial - eletricista já existente',
          createdBy,
        },
      });

      // Criar registro no histórico
      await prisma.eletricistaStatusHistorico.create({
        data: {
          eletricistaId: eletricista.id,
          status: StatusEletricista.ATIVO,
          statusAnterior: null,
          dataInicio: eletricista.createdAt || agora,
          dataFim: null,
          motivo: 'Status inicial - eletricista já existente',
          registradoPor: createdBy,
          createdBy,
        },
      });

      console.log(`✅ Status criado para eletricista ${eletricista.id} - ${eletricista.nome}`);
    }

    console.log(
      `🎉 Seed concluído! ${eletricistasSemStatus.length} eletricistas agora têm status ATIVO.`
    );
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedStatusInicial()
    .then(() => {
      console.log('✅ Seed finalizado com sucesso');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro no seed:', error);
      process.exit(1);
    });
}

export { seedStatusInicial };
```

### Opção B: Script SQL (Alternativa)

Se preferir executar diretamente no banco, você pode usar este SQL após a migration:

```sql
-- Popular status inicial para todos os eletricistas existentes
INSERT INTO EletricistaStatus (
  eletricistaId,
  status,
  dataInicio,
  motivo,
  createdAt,
  createdBy
)
SELECT
  id,
  'ATIVO',
  COALESCE(createdAt, NOW()),
  'Status inicial - eletricista já existente',
  NOW(),
  COALESCE(createdBy, 'system')
FROM Eletricista
WHERE deletedAt IS NULL
  AND id NOT IN (SELECT eletricistaId FROM EletricistaStatus);

-- Popular histórico inicial
INSERT INTO EletricistaStatusHistorico (
  eletricistaId,
  status,
  statusAnterior,
  dataInicio,
  dataFim,
  motivo,
  registradoPor,
  registradoEm,
  createdAt,
  createdBy
)
SELECT
  id,
  'ATIVO',
  NULL,
  COALESCE(createdAt, NOW()),
  NULL,
  'Status inicial - eletricista já existente',
  COALESCE(createdBy, 'system'),
  NOW(),
  NOW(),
  COALESCE(createdBy, 'system')
FROM Eletricista
WHERE deletedAt IS NULL
  AND id NOT IN (SELECT eletricistaId FROM EletricistaStatusHistorico);
```

---

## 🧪 Passo 4: Executar o Script de Seed

### Se usar TypeScript/Node:

```bash
cd packages/db
# Compilar TypeScript (se necessário)
npx ts-node scripts/seed-status-inicial.ts
```

Ou adicione ao `package.json`:

```json
{
  "scripts": {
    "seed:status": "ts-node scripts/seed-status-inicial.ts"
  }
}
```

### Se usar SQL direto:

Execute o SQL no seu cliente MySQL ou via Prisma Studio.

---

## ✅ Passo 5: Verificar

Verifique se tudo foi criado corretamente:

```typescript
// Verificar quantos eletricistas têm status
const totalComStatus = await prisma.eletricistaStatus.count();
const totalEletricistas = await prisma.eletricista.count({
  where: { deletedAt: null },
});

console.log(`Total eletricistas: ${totalEletricistas}`);
console.log(`Total com status: ${totalComStatus}`);
```

Ou via SQL:

```sql
SELECT
  (SELECT COUNT(*) FROM Eletricista WHERE deletedAt IS NULL) as total_eletricistas,
  (SELECT COUNT(*) FROM EletricistaStatus) as total_com_status;
```

---

## 🚨 Produção

Para produção, você pode:

1. **Criar a migration:**

   ```bash
   npm run migrate:deploy
   ```

2. **Executar o seed após a migration:**

   ```bash
   # Via script
   npm run seed:status

   # Ou via SQL direto no banco
   ```

3. **Verificar antes de aplicar:**
   - Sempre teste em ambiente de staging primeiro
   - Faça backup do banco antes
   - Verifique quantos registros serão afetados

---

## 📝 Checklist Completo

- [ ] Modelos Prisma criados e atualizados
- [ ] Migration criada com `prisma migrate dev`
- [ ] Migration aplicada no banco
- [ ] Script de seed criado
- [ ] Seed executado e dados populados
- [ ] Verificação de dados realizada
- [ ] Testes manuais realizados
- [ ] Documentação atualizada

---

## 🔍 Troubleshooting

### Erro: "Table already exists"

- A migration já foi aplicada. Pule para o passo de seed.

### Erro: "Foreign key constraint fails"

- Verifique se os relacionamentos estão corretos no Prisma
- Certifique-se de que os eletricistas existem antes de criar status

### Erro: "Duplicate entry"

- Alguns eletricistas já têm status. O script verifica isso automaticamente.

### Dados não aparecem

- Verifique se o seed foi executado
- Confirme que não há filtros de `deletedAt` impedindo a busca

---

## 📚 Próximos Passos

Após a migration e seed:

1. ✅ Testar criação de novos eletricistas (deve criar status automaticamente)
2. ✅ Implementar `EletricistaStatusService`
3. ✅ Criar endpoints da API
4. ✅ Integrar com módulo de escalas
5. ✅ Criar interface no frontend

---

**Nota:** Este processo é idempotente - pode ser executado múltiplas vezes sem problemas. O script
verifica se o status já existe antes de criar.
