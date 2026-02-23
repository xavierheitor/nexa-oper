# 📊 Design: Sistema de Status de Eletricistas

## 🎯 Objetivo

Rastrear o status atual e histórico de eletricistas (funcionários), permitindo saber se estão:

- **Trabalhando** (ativo, em operação)
- **Afastado** (licença, suspensão, etc)
- **Férias** (período de férias)
- **Desligado** (demissão, aposentadoria)
- E outros status relevantes

## 🏗️ Arquitetura Proposta

### Abordagem: Status Atual + Histórico Completo

**Vantagens:**

- ✅ Consulta rápida do status atual (campo direto)
- ✅ Histórico completo para auditoria e relatórios
- ✅ Rastreabilidade de mudanças
- ✅ Integração com escalas (evitar escalar quem está de férias)

---

## 📋 Modelo de Dados

### 1. Enum: StatusEletricista

```prisma
enum StatusEletricista {
  ATIVO              // Trabalhando normalmente
  FERIAS             // Em período de férias
  LICENCA_MEDICA     // Licença médica
  LICENCA_MATERNIDADE // Licença maternidade/paternidade
  LICENCA_PATERNIDADE
  SUSPENSAO          // Suspensão disciplinar
  TREINAMENTO        // Em treinamento/capacitação
  AFastADO           // Afastado por outros motivos
  DESLIGADO          // Desligado da empresa
  APOSENTADO         // Aposentado
}
```

### 2. Modelo: EletricistaStatus (Status Atual)

```prisma
model EletricistaStatus {
  id              Int               @id @default(autoincrement())
  eletricistaId   Int               @unique
  eletricista     Eletricista       @relation(fields: [eletricistaId], references: [id], onDelete: Cascade)

  status          StatusEletricista @default(ATIVO)

  // Período do status atual (se aplicável)
  dataInicio      DateTime          @default(now())
  dataFim          DateTime?        // null = status atual indefinido

  // Motivo e detalhes
  motivo          String?           @db.VarChar(500)
  observacoes     String?           @db.VarChar(1000)

  // Documentos/atestados relacionados (opcional)
  documentoPath   String?           @db.VarChar(1000)

  // Auditoria
  createdAt       DateTime          @default(now())
  createdBy       String            @db.VarChar(255)
  updatedAt       DateTime?         @updatedAt
  updatedBy       String?           @db.VarChar(255)

  // Relacionamento com histórico
  Historico       EletricistaStatusHistorico[]

  @@index([status])
  @@index([dataInicio])
  @@index([eletricistaId, status])
}
```

### 3. Modelo: EletricistaStatusHistorico (Histórico Completo)

```prisma
model EletricistaStatusHistorico {
  id              Int               @id @default(autoincrement())
  eletricistaId   Int
  eletricista     Eletricista       @relation(fields: [eletricistaId], references: [id], onDelete: Cascade)

  status          StatusEletricista
  statusAnterior  StatusEletricista? // Para rastrear transições

  // Período do status
  dataInicio      DateTime
  dataFim          DateTime?         // null = ainda ativo neste status

  // Motivo e detalhes
  motivo          String?           @db.VarChar(500)
  observacoes     String?           @db.VarChar(1000)

  // Documentos relacionados
  documentoPath   String?           @db.VarChar(1000)

  // Quem registrou e quando
  registradoPor   String            @db.VarChar(255)
  registradoEm    DateTime          @default(now())

  // Auditoria
  createdAt       DateTime          @default(now())
  createdBy       String            @db.VarChar(255)
  updatedAt       DateTime?         @updatedAt
  updatedBy       String?           @db.VarChar(255)

  @@index([eletricistaId])
  @@index([status])
  @@index([dataInicio])
  @@index([dataFim])
  @@index([eletricistaId, dataInicio])
  @@index([eletricistaId, status])
}
```

### 4. Atualização do Modelo Eletricista

```prisma
model Eletricista {
  // ... campos existentes ...

  // Novo relacionamento
  Status          EletricistaStatus?
  StatusHistorico EletricistaStatusHistorico[]
}
```

---

## 🔄 Fluxo de Funcionamento

### 1. **Criação de Eletricista**

- Ao criar, automaticamente cria `EletricistaStatus` com `status = ATIVO`
- Registra no histórico

### 2. **Mudança de Status**

- Atualiza `EletricistaStatus` (status atual)
- Fecha registro anterior no histórico (`dataFim`)
- Cria novo registro no histórico

### 3. **Consulta de Status Atual**

- Busca direta em `EletricistaStatus` (rápido)
- Se não existir, assume `ATIVO` (compatibilidade)

### 4. **Consulta de Histórico**

- Busca em `EletricistaStatusHistorico` por período
- Permite ver evolução do status ao longo do tempo

---

## 📊 Casos de Uso

### 1. **Registrar Férias**

```typescript
// Registrar início de férias
await registrarStatusEletricista({
  eletricistaId: 123,
  status: StatusEletricista.FERIAS,
  dataInicio: new Date('2025-01-15'),
  dataFim: new Date('2025-02-15'),
  motivo: 'Férias anuais',
  registradoPor: 'admin@nexa.com',
});
```

### 2. **Verificar se pode escalar**

```typescript
// Antes de escalar, verificar status
const status = await getStatusAtual(eletricistaId);

if (status.status !== StatusEletricista.ATIVO) {
  throw new Error(`Eletricista não pode ser escalado: ${status.status}`);
}
```

### 3. **Relatório de Afastados**

```typescript
// Listar todos os afastados em um período
const afastados = await prisma.eletricistaStatusHistorico.findMany({
  where: {
    status: { in: [StatusEletricista.FERIAS, StatusEletricista.LICENCA_MEDICA] },
    dataInicio: { lte: dataFim },
    dataFim: { gte: dataInicio },
  },
});
```

### 4. **Histórico de Status**

```typescript
// Ver histórico completo de um eletricista
const historico = await prisma.eletricistaStatusHistorico.findMany({
  where: { eletricistaId: 123 },
  orderBy: { dataInicio: 'desc' },
});
```

---

## 🔗 Integração com Sistema Existente

### 1. **Integração com Escalas**

- Ao gerar slots, verificar status do eletricista
- Não escalar se estiver de férias/afastado
- Mostrar alerta se tentar escalar

### 2. **Integração com Faltas**

- Faltas podem ser relacionadas a status (ex: licença médica)
- Evitar marcar falta se houver status de afastamento

### 3. **Integração com Turnos**

- Verificar status antes de permitir abrir turno
- Alertar se status não permite trabalho

---

## 📝 Regras de Negócio

### 1. **Transições de Status**

- `ATIVO` → Qualquer outro status (permitido)
- `FERIAS` → `ATIVO` ou `LICENCA_MEDICA` (permitido)
- `DESLIGADO` → Nenhum outro status (final)
- `APOSENTADO` → Nenhum outro status (final)

### 2. **Validações**

- Não permitir escalar eletricista com status não-ATIVO
- Não permitir abrir turno se status não permitir trabalho
- Validar períodos de férias (não sobrepor)
- Validar documentos quando necessário (ex: atestado médico)

### 3. **Notificações**

- Notificar antes de férias expirarem
- Notificar sobre mudanças de status
- Alertar sobre conflitos (escala vs status)

---

## 🎨 Interface do Usuário (Sugestões)

### 1. **Badge de Status no Card do Eletricista**

```bash
[Eletricista] João Silva
Status: 🟢 ATIVO | 🟡 FÉRIAS | 🔴 AFastADO
```

### 2. **Tela de Gestão de Status**

- Lista de eletricistas com status atual
- Filtros por status
- Ações: Registrar férias, Licença, Suspensão, etc.

### 3. **Histórico de Status**

- Timeline visual do histórico
- Gráfico de tempo em cada status
- Documentos anexados

### 4. **Integração com Escala**

- Indicador visual na escala (cor diferente para afastados)
- Tooltip com motivo do afastamento
- Bloqueio de escalação se necessário

---

## 🚀 Implementação Sugerida

### Fase 1: Estrutura Base

1. ✅ Criar enum `StatusEletricista`
2. ✅ Criar modelos `EletricistaStatus` e `EletricistaStatusHistorico`
3. ✅ Migration do banco de dados
4. ✅ Atualizar modelo `Eletricista`

### Fase 2: Serviços e Lógica

1. ✅ Criar `EletricistaStatusService`
2. ✅ Métodos: `registrarStatus`, `getStatusAtual`, `getHistorico`
3. ✅ Validações de transições
4. ✅ Integração com criação de eletricista

### Fase 3: Integrações

1. ✅ Integração com módulo de escalas
2. ✅ Integração com módulo de turnos
3. ✅ Validações em endpoints existentes

### Fase 4: Interface

1. ✅ CRUD de status no frontend
2. ✅ Visualização de histórico
3. ✅ Badges e indicadores visuais
4. ✅ Relatórios

---

## 📊 Exemplo de Consultas Úteis

### Status Atual de Todos os Eletricistas

```typescript
const eletricistasComStatus = await prisma.eletricista.findMany({
  include: {
    Status: true,
    cargo: true,
    contrato: true,
  },
});
```

### Eletricistas em Férias no Período

```typescript
const emFerias = await prisma.eletricistaStatus.findMany({
  where: {
    status: StatusEletricista.FERIAS,
    dataInicio: { lte: dataFim },
    OR: [{ dataFim: { gte: dataInicio } }, { dataFim: null }],
  },
  include: { eletricista: true },
});
```

### Histórico de Mudanças de Status

```typescript
const historico = await prisma.eletricistaStatusHistorico.findMany({
  where: {
    eletricistaId: 123,
    dataInicio: { gte: dataInicio, lte: dataFim },
  },
  orderBy: { dataInicio: 'desc' },
});
```

---

## 🤔 Considerações Adicionais

### 1. **Performance**

- Índices adequados para consultas frequentes
- Cache do status atual (se necessário)
- Paginação no histórico

### 2. **Segurança**

- Permissões para alterar status
- Auditoria completa de mudanças
- Validação de documentos

### 3. **Notificações**

- Alertas automáticos (ex: férias próximas)
- Notificações de mudanças de status
- Relatórios periódicos

### 4. **Integração com RH**

- Sincronização com sistemas externos (se houver)
- Exportação de dados para relatórios
- APIs para consulta externa

---

## ✅ Próximos Passos

1. **Revisar e aprovar design**
2. **Criar migration do banco**
3. **Implementar serviços**
4. **Criar endpoints da API**
5. **Desenvolver interface**
6. **Testes e validações**

---

**Autor:** Sistema Nexa Oper **Data:** 2025-01-04 **Versão:** 1.0
