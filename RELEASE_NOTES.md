# 🏷️ Release Notes

## 📦 Versões

### Web: `v0.1.1`
### API: `v0.0.2`

---

## 🚀 Web v0.1.1

### ✨ Novas Funcionalidades

- **Campo Motorista**: Identificação visual de motoristas nas tabelas de turnos
  - Ícone de carro azul ao lado do nome do motorista
  - Implementado em Visão Geral e Histórico de Turnos
  - Tooltip indicando "Motorista" ao passar o mouse

- **Melhorias nos Relatórios**:
  - Campo "KM de Abertura" adicionado na exportação
  - Campo "Motorista" (Sim/Não) adicionado na exportação
  - Campos de data e hora combinados para evitar confusão
  - Formato: "Hora Abertura (Data e Hora)" e "Hora Final (Data e Hora)"

### 🐛 Correções

- Corrigido erro de importação em `criarJustificativa.ts`
- Corrigido erro de tipo em `justificativas-equipe/criar/page.tsx`
- Corrigido erro de query Prisma em `relatoriosTurnos.ts`
- Ajustado filtro de eletricista no relatório

### 📊 Melhorias

- Relatórios agora usam campo `motorista` da tabela ao invés de verificar pelo cargo
- Informação de motorista preservada desde a abertura do turno

---

## 🔧 API v0.0.2

### ✨ Novas Funcionalidades

- **Campo Motorista na Tabela TurnoEletricistas**:
  - Campo `motorista` (boolean, default: false) adicionado
  - Migration criada: `20251207200305_add_motorista_to_turno_eletricista`
  - Compatível com dados existentes

### 🔄 Alterações

- **DTOs Atualizados**:
  - `EletricistaTurnoDto` agora inclui campo `motorista?: boolean`
  - Campo opcional para manter compatibilidade

- **Controller Mobile**:
  - Mapeamento do campo `motorista` do DTO mobile para o DTO padrão
  - Informação de motorista preservada na abertura de turno

- **Service de Turnos**:
  - Salvamento do campo `motorista` ao criar `TurnoEletricistas`
  - Valor padrão `false` para turnos criados pelo backoffice

### 📝 Notas de Migração

- **Compatibilidade**: Totalmente compatível com dados existentes
- **Valor padrão**: Todos os registros existentes terão `motorista = false`
- **Novos turnos**: Campo será preenchido corretamente a partir de agora

---

## 🔗 Comandos para Criar Tags

```bash
# Tag para Web
git tag -a v0.1.1 -m "Web v0.1.1: Campo Motorista e Melhorias nos Relatórios"

# Tag para API
git tag -a api-v0.0.2 -m "API v0.0.2: Campo Motorista na Tabela TurnoEletricistas"

# Push das tags
git push origin v0.1.1
git push origin api-v0.0.2
```

---

## 📋 Checklist de Release

- [x] Build do Web concluído com sucesso
- [x] Build da API concluído com sucesso
- [x] Type-check passou em ambos os projetos
- [x] Migration testada
- [x] Versões atualizadas nos package.json
- [ ] Tags criadas
- [ ] Tags enviadas para o repositório remoto
- [ ] Release notes publicadas

---

**Data**: 2025-12-07
**Autor**: Sistema Nexa Oper

