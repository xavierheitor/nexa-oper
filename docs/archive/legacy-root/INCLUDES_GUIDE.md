# 🚀 Sistema de Includes Dinâmicos

## 📖 Visão Geral

O sistema de includes permite configurar dinamicamente quais relacionamentos (joins) trazer nas
consultas, diretamente no hook `useEntityData`, sem precisar modificar o backend.

## 🎯 Como Usar

### 1. **Configuração Básica**

```typescript
const veiculos = useEntityData<Veiculo>({
  key: 'veiculos',
  fetcher: unwrapFetcher(listVeiculos),
  paginationEnabled: true,
  initialParams: {
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    // ✨ INCLUDES DINÂMICOS
    include: {
      tipoVeiculo: true, // Traz dados do tipo de veículo
      contrato: true, // Traz dados do contrato
    },
  },
});
```

### 2. **Includes Aninhados**

```typescript
include: {
  contrato: {
    include: {
      cliente: true,     // Traz cliente do contrato
      endereco: true,    // Traz endereço do contrato
    }
  },
  tipoVeiculo: true,
  manutencoes: {
    include: {
      tecnico: true,     // Traz dados do técnico de cada manutenção
      pecas: true,       // Traz peças usadas
    }
  }
}
```

### 3. **Includes Condicionais**

```typescript
const includeRelacionamentos = useMemo(() => {
  const base = { tipoVeiculo: true };

  // Só inclui contrato se usuário tem permissão
  if (hasPermission('view_contratos')) {
    base.contrato = true;
  }

  // Inclui histórico apenas se solicitado
  if (showHistorico) {
    base.historico = { include: { usuario: true } };
  }

  return base;
}, [hasPermission, showHistorico]);

const veiculos = useEntityData<Veiculo>({
  // ... outras configurações
  initialParams: {
    // ... outros params
    include: includeRelacionamentos,
  },
});
```

## 🔧 Exemplos Práticos

### **Veículos com Relacionamentos**

```typescript
// apps/web/src/app/dashboard/veiculo/page.tsx
const veiculos = useEntityData<Veiculo>({
  key: 'veiculos',
  fetcher: unwrapFetcher(listVeiculos),
  paginationEnabled: true,
  initialParams: {
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    include: {
      tipoVeiculo: true, // Nome do tipo (Carro, Moto, etc)
      contrato: true, // Nome e número do contrato
    },
  },
});

// Agora você pode acessar:
// veiculo.tipoVeiculo.nome
// veiculo.contrato.nome
// veiculo.contrato.numero
```

### **Contratos com Veículos**

```typescript
const contratos = useEntityData<Contrato>({
  key: 'contratos',
  fetcher: unwrapFetcher(listContratos),
  paginationEnabled: true,
  initialParams: {
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    include: {
      veiculos: {
        include: {
          tipoVeiculo: true, // Tipo de cada veículo
        },
      },
      cliente: true, // Dados do cliente
    },
  },
});
```

### **Tipos de Veículo com Contagem**

```typescript
const tiposVeiculo = useEntityData<TipoVeiculo>({
  key: 'tipos-veiculo',
  fetcher: unwrapFetcher(listTiposVeiculo),
  paginationEnabled: true,
  initialParams: {
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
    include: {
      _count: {
        select: {
          veiculos: true, // Conta quantos veículos de cada tipo
        },
      },
    },
  },
});
```

## 🎨 Interface Atualizada

### **Tabela com Relacionamentos**

```typescript
const columns = useTableColumnsWithActions<Veiculo>([
  {
    title: 'Placa',
    dataIndex: 'placa',
    key: 'placa',
  },
  {
    title: 'Tipo',
    dataIndex: ['tipoVeiculo', 'nome'], // ✨ Acessa relacionamento
    key: 'tipoVeiculo',
    render: (nome: string) => nome || '-',
  },
  {
    title: 'Contrato',
    key: 'contrato',
    render: (_, record: Veiculo) => {
      const contrato = (record as any).contrato;
      return contrato ? `${contrato.nome} (${contrato.numero})` : '-';
    },
  },
]);
```

## 🔄 Performance

### **Otimizações Automáticas**

- ✅ **Lazy Loading**: Só carrega relacionamentos solicitados
- ✅ **Cache Inteligente**: SWR cacheia com base na chave + includes
- ✅ **Queries Otimizadas**: Prisma gera JOINs eficientes
- ✅ **Paginação Mantida**: Count não é afetado pelos includes

### **Boas Práticas**

```typescript
// ✅ BOM: Includes específicos
include: {
  tipoVeiculo: true,
  contrato: { select: { nome: true, numero: true } }
}

// ❌ EVITAR: Includes muito aninhados
include: {
  contrato: {
    include: {
      cliente: {
        include: {
          endereco: {
            include: { cidade: true }
          }
        }
      }
    }
  }
}

// ✅ BOM: Usar select para campos específicos
include: {
  contrato: {
    select: {
      nome: true,
      numero: true,
      cliente: {
        select: { nome: true }
      }
    }
  }
}
```

## 🛠 Arquitetura

### **Fluxo de Dados**

```bash
Frontend (Hook)
    ↓ include: { tipoVeiculo: true }
Server Action
    ↓
Service (validação)
    ↓
Repository (findMany com include)
    ↓
Prisma (SELECT com JOINs)
    ↓
Database (consulta otimizada)
```

### **Compatibilidade**

- ✅ **Todos os repositórios**: Contrato, TipoVeiculo, Veiculo
- ✅ **Todos os métodos**: list, findById (se implementado)
- ✅ **Prisma nativo**: Usa includes do Prisma diretamente
- ✅ **Type Safety**: TypeScript mantém tipagem

## 🚀 Exemplos Avançados

### **Dashboard com Estatísticas**

```typescript
const dashboard = useEntityData({
  key: 'dashboard-veiculos',
  fetcher: unwrapFetcher(listVeiculos),
  initialParams: {
    page: 1,
    pageSize: 5, // Apenas últimos 5
    orderBy: 'createdAt',
    orderDir: 'desc',
    include: {
      tipoVeiculo: true,
      contrato: {
        select: {
          nome: true,
          status: true,
        },
      },
      _count: {
        select: {
          manutencoes: true,
        },
      },
    },
  },
});
```

### **Relatórios Detalhados**

```typescript
const relatorio = useEntityData({
  key: 'relatorio-completo',
  fetcher: unwrapFetcher(listVeiculos),
  initialParams: {
    pageSize: 100, // Mais dados para relatório
    include: {
      tipoVeiculo: true,
      contrato: {
        include: {
          cliente: {
            select: { nome: true, documento: true },
          },
        },
      },
      manutencoes: {
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
          },
        },
        select: {
          tipo: true,
          custo: true,
          createdAt: true,
        },
      },
    },
  },
});
```

## 🎯 Resultado

Agora você tem **controle total** sobre quais dados carregar, **sem modificar o backend**, com
**performance otimizada** e **type safety** mantido! 🚀✨
