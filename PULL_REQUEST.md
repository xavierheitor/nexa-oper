# 🚀 Adição de Campo Motorista e Melhorias nos Relatórios

## 📋 Resumo

Esta PR adiciona o campo `motorista` na tabela `TurnoEletricistas` para identificar qual eletricista é o motorista do turno, além de melhorias nos relatórios e correções de bugs.

## ✨ Principais Alterações

### 🗄️ Banco de Dados

- **Adicionado campo `motorista` (boolean, default: false)** na tabela `TurnoEletricistas`
- **Migration criada**: `20251207200305_add_motorista_to_turno_eletricista`
  - Campo com valor padrão `false` para não afetar dados existentes
  - Compatível com dados históricos

### 🔧 Backend (API)

- **DTOs atualizados**:
  - `EletricistaTurnoDto` agora inclui campo `motorista?: boolean`
  - Campo opcional para manter compatibilidade

- **Controller Mobile**:
  - Mapeamento do campo `motorista` do DTO mobile para o DTO padrão
  - Informação de motorista agora é preservada na abertura de turno

- **Service de Turnos**:
  - Salvamento do campo `motorista` ao criar `TurnoEletricistas`
  - Valor padrão `false` para turnos criados pelo backoffice

### 🌐 Frontend (Web)

- **Repositório**:
  - `TurnoRepository` atualizado para incluir `motorista` no mapeamento de eletricistas
  - Campo disponível em todas as consultas de turnos

- **Relatórios**:
  - `getTurnosPorPeriodo` atualizado para buscar e retornar campo `motorista`
  - Relatório "Turnos por Período" agora usa campo da tabela ao invés de verificar pelo cargo
  - Exportação Excel inclui coluna "Motorista" (Sim/Não)

- **Interface do Usuário**:
  - **Ícone de carro** (`CarOutlined`) adicionado ao lado do nome do eletricista motorista
  - Implementado nas tabelas de:
    - Visão Geral de Turnos (`/dashboard/turnos`)
    - Histórico de Turnos (`/dashboard/historico`)
  - Tooltip atualizado para indicar "Motorista" quando aplicável

### 📊 Melhorias nos Relatórios

- **Relatório "Turnos por Período"**:
  - Campo "KM de Abertura" adicionado na exportação
  - Campo "Motorista" (Sim/Não) adicionado na exportação
  - Campos de data e hora combinados para evitar confusão em turnos que cruzam dias
  - Formato: "Hora Abertura (Data e Hora)" e "Hora Final (Data e Hora)"

### 🐛 Correções de Bugs

- Corrigido erro de importação em `criarJustificativa.ts` (caminhos relativos)
- Corrigido erro de tipo em `justificativas-equipe/criar/page.tsx` (propriedade `items`)
- Corrigido erro de query Prisma em `relatoriosTurnos.ts` (mistura de `select` e `include`)
- Ajustado filtro de eletricista no relatório para retornar sempre boolean

### 📦 Versionamento

- **Web**: `0.1.0` → `0.1.1`
- **API**: `0.0.1` → `0.0.2`

## 🔍 Detalhes Técnicos

### Migration

```sql
ALTER TABLE `TurnoEletricistas` ADD COLUMN `motorista` BOOLEAN NOT NULL DEFAULT false;
```

### Estrutura de Dados

```typescript
interface TurnoEletricista {
  id: number;
  turnoId: number;
  eletricistaId: number;
  motorista: boolean; // ← Novo campo
  // ... outros campos
}
```

### Fluxo de Dados

1. **Mobile** → Envia `motorista: boolean` no `EletricistaMobileDto`
2. **Controller** → Mapeia para `EletricistaTurnoDto` com campo `motorista`
3. **Service** → Salva no banco ao criar `TurnoEletricista`
4. **Repository** → Retorna campo `motorista` em todas as consultas
5. **Frontend** → Exibe ícone de carro quando `motorista === true`

## ✅ Testes Realizados

- ✅ Build do Web concluído com sucesso
- ✅ Build da API concluído com sucesso
- ✅ Type-check passou em ambos os projetos
- ✅ Linter sem erros críticos
- ✅ Migration testada (campo com default false)

## 📝 Notas de Migração

- **Compatibilidade**: Totalmente compatível com dados existentes
- **Valor padrão**: Todos os registros existentes terão `motorista = false`
- **Novos turnos**: Campo será preenchido corretamente a partir de agora
- **Dados históricos**: Podem ser atualizados manualmente se necessário

## 🎯 Impacto

- **Usuários**: Agora podem identificar visualmente quem é o motorista em cada turno
- **Relatórios**: Informação de motorista disponível para análise e exportação
- **Dados**: Informação de motorista preservada desde a abertura do turno
- **Performance**: Sem impacto negativo (campo indexável se necessário no futuro)

## 📸 Screenshots

### Antes
- Eletricistas listados sem identificação de motorista
- Relatórios sem informação de motorista

### Depois
- Ícone de carro azul ao lado do nome do motorista
- Coluna "Motorista" no relatório exportado
- Tooltip indicando "Motorista" ao passar o mouse

## 🔗 Issues Relacionadas

- Implementação do campo motorista na tabela TurnoEletricista
- Melhoria na identificação visual de motoristas
- Adição de informações de motorista nos relatórios

---

**Versões**: Web `0.1.1` | API `0.0.2`

