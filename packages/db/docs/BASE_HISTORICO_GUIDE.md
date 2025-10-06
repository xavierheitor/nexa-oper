# Guia de Histórico de Bases

Este documento explica como usar o sistema de histórico de bases para rastrear transferências de eletricistas e veículos entre diferentes bases.

## 📋 Entidades Criadas

### 1. EletricistaBaseHistorico
Rastreia todas as transferências de eletricistas entre bases.

### 2. VeiculoBaseHistorico
Rastreia todas as transferências de veículos entre bases.

## 🎯 Casos de Uso

### Transferência de Eletricista
```typescript
// 1. Finalizar período atual na base anterior
await prisma.eletricistaBaseHistorico.update({
  where: { id: historicoAtualId },
  data: {
    dataFim: new Date(),
    updatedBy: userId
  }
});

// 2. Criar novo registro na nova base
await prisma.eletricistaBaseHistorico.create({
  data: {
    eletricistaId: eletricistaId,
    baseId: novaBaseId,
    dataInicio: new Date(),
    motivo: 'Transferência por necessidade operacional',
    createdBy: userId
  }
});
```

### Transferência de Veículo
```typescript
// 1. Finalizar período atual na base anterior
await prisma.veiculoBaseHistorico.update({
  where: { id: historicoAtualId },
  data: {
    dataFim: new Date(),
    updatedBy: userId
  }
});

// 2. Criar novo registro na nova base
await prisma.veiculoBaseHistorico.create({
  data: {
    veiculoId: veiculoId,
    baseId: novaBaseId,
    dataInicio: new Date(),
    motivo: 'Transferência para manutenção',
    createdBy: userId
  }
});
```

## 📊 Consultas Úteis

### Base Atual de um Eletricista
```typescript
const baseAtual = await prisma.eletricistaBaseHistorico.findFirst({
  where: {
    eletricistaId: eletricistaId,
    dataFim: null // Ainda está na base
  },
  include: {
    base: true,
    eletricista: true
  }
});
```

### Histórico Completo de um Eletricista
```typescript
const historico = await prisma.eletricistaBaseHistorico.findMany({
  where: { eletricistaId: eletricistaId },
  include: { base: true },
  orderBy: { dataInicio: 'desc' }
});
```

### Eletricistas Atualmente em uma Base
```typescript
const eletricistasNaBase = await prisma.eletricistaBaseHistorico.findMany({
  where: {
    baseId: baseId,
    dataFim: null
  },
  include: {
    eletricista: true
  }
});
```

### Veículos Atualmente em uma Base
```typescript
const veiculosNaBase = await prisma.veiculoBaseHistorico.findMany({
  where: {
    baseId: baseId,
    dataFim: null
  },
  include: {
    veiculo: true
  }
});
```

## 🔄 Regras de Negócio

### 1. Apenas um registro ativo por vez
- Um eletricista/veículo só pode estar em uma base por vez
- Sempre finalize o período anterior antes de criar um novo

### 2. Controle de datas
- `dataInicio`: Obrigatória, quando chegou na base
- `dataFim`: Opcional, quando saiu da base (null = ainda está na base)

### 3. Motivo da transferência
- Campo opcional para documentar o motivo
- Útil para auditoria e relatórios

## 📈 Relatórios Possíveis

### 1. Relatório de Movimentação
```typescript
const movimentacoes = await prisma.eletricistaBaseHistorico.findMany({
  where: {
    dataInicio: {
      gte: dataInicio,
      lte: dataFim
    }
  },
  include: {
    eletricista: true,
    base: true
  },
  orderBy: { dataInicio: 'desc' }
});
```

### 2. Tempo em cada Base
```typescript
const tempoPorBase = await prisma.eletricistaBaseHistorico.groupBy({
  by: ['baseId'],
  where: { eletricistaId: eletricistaId },
  _count: { id: true },
  _min: { dataInicio: true },
  _max: { dataFim: true }
});
```

## 🚀 Próximos Passos

1. **Criar Migration**: Executar `npx prisma migrate dev`
2. **Criar Services**: Implementar lógica de negócio
3. **Criar Controllers**: Endpoints para gerenciar transferências
4. **Criar Frontend**: Interface para visualizar e gerenciar histórico
5. **Relatórios**: Dashboards com movimentações

## 💡 Dicas de Implementação

- Use transações para garantir consistência
- Implemente validações para evitar sobreposições
- Crie índices para performance em consultas frequentes
- Documente sempre o motivo das transferências
- Mantenha auditoria completa de todas as operações
