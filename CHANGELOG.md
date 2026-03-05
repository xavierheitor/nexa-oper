# Changelog

## [Unreleased]

### 📝 Em preparação

- Sem alterações publicadas após a `v1.1.0`.

## [1.1.0] - 2026-03-05

### 🎯 Novas Funcionalidades

#### 📋 Consulta de Checklists

Adicionada nova página **"Consulta Checklists"** no menu Segurança, permitindo busca avançada e visualização completa de checklists preenchidos.

**Funcionalidades da Listagem:**
- **Filtros disponíveis:**
  - Período (data início e fim) - padrão: mês atual
  - Tipo de equipe
  - Equipe (filtrado por tipo de equipe selecionado)
  - Placa do veículo (busca parcial)
  - Eletricista
  - Base
  - Tipo de checklist
  - Checklist específico (filtrado por tipo de checklist selecionado)

- **Listagem com informações resumidas:**
  - ID do checklist
  - Data e hora do preenchimento
  - Nome do checklist e tipo
  - Dados do eletricista (nome e matrícula)
  - Informações da equipe e tipo
  - Dados do veículo (placa e modelo)
  - Quantidade de respostas

- **Recursos:**
  - Paginação funcional
  - Botão "Limpar Filtros" para reset rápido
  - Botão "Ver" para acessar detalhes completos
  - Tabela responsiva com scroll horizontal

**Página de Detalhes do Checklist:**
- **Informações gerais:**
  - Dados completos do checklist (nome, tipo, data, hora)
  - Informações do eletricista (nome e matrícula)
  - Dados do turno (equipe, tipo de equipe, veículo)
  - Localização geográfica (latitude/longitude), se disponível

- **Visualização de respostas:**
  - Todas as perguntas e respostas do checklist
  - Status de cada resposta (respondido, com foto, aguardando foto)
  - Indicação de respostas que geram pendência
  - Data e hora de cada resposta

- **Gerenciamento de fotos:**
  - Visualização de todas as fotos associadas às respostas
  - Preview com zoom
  - Informações de tamanho e data de sincronização
  - Suporte para múltiplas fotos por resposta

#### 📊 Melhorias no Relatório de Segurança

Adicionado filtro por **Tipo de Equipe** no relatório de checklist, permitindo filtrar os dados de reprovas por tipo específico de equipe.

- O filtro funciona em conjunto com o filtro de base existente
- Aplicado aos três gráficos:
  - Top 10 Perguntas com Mais Reprovas
  - Top 10 Equipes com Mais Reprovas
  - Reprovas por Tipo de Checklist

### 🔧 Melhorias Técnicas

#### Server Actions

- **`listChecklistsPreenchidos`**: Nova action para buscar checklists preenchidos com filtros avançados e paginação
- **`getChecklistPreenchidoById`**: Nova action para buscar detalhes completos de um checklist específico
- **Atualização das actions de relatório**: Todas as três actions (`getReprovasPorPergunta`, `getReprovasPorEquipe`, `getReprovasPorTipoChecklist`) agora suportam filtro por tipo de equipe

#### Correções de Tipos

- Correção de conversão de tipos `null` para `undefined` nas interfaces TypeScript
- Conversão adequada de objetos `Date` para strings ISO
- Ajustes de compatibilidade entre tipos do Prisma e interfaces do frontend

### 🎨 Melhorias de UX

- Interface intuitiva com filtros organizados em grid responsivo
- Feedback visual claro sobre status de respostas e pendências
- Navegação fluida entre listagem e detalhes
- Informações organizadas em cards e colapsos para melhor visualização

### 🚀 Plataforma e Módulos Entregues

- Novo módulo de **Atividades** com visão geral, materiais e medidores.
- Implementação de **APR** ponta a ponta (modelos, respostas, assinaturas e evidências).
- Evolução do pipeline de upload com **vínculo canônico de evidências**, deduplicação por checksum e metadados de sincronização.
- CRUD completo de **Causa de Improdutividade** e classificação de produtividade em atividades.
- Exportações em Excel e novos filtros de período nas telas operacionais.

### 🐛 Correções

- Ajustada a visualização de checklist para não exibir falso estado de “foto não sincronizada” quando `fotosSincronizadas > 0`.
- Dashboard configurado como renderização dinâmica para evitar erros de build por uso de `headers()` em rotas server-side.

### 📝 Notas

- Todos os filtros são opcionais e podem ser combinados
- A paginação padrão é de 20 itens por página
- As buscas por placa de veículo são case-insensitive e suportam busca parcial
- Os dados são atualizados automaticamente quando os filtros são alterados
