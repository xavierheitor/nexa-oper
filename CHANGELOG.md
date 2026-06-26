# Changelog

## [Unreleased]

### 📝 Em preparação

- Sem alterações publicadas após a `v1.2.0`.

## [1.2.0] - 2026-06-26

### 🎯 Novas Funcionalidades

#### 📱 Versões do App Mobile

- Painel **Cadastro → Usuários → Versões do App** para publicar APKs Android
- Manifesto público para auto-update: `GET /api/public/mobile-app-version/manifest`
- Políticas por build: login, abertura de turno, upload e wipe local
- Permissões dedicadas: `mobile-app-version:view` e `mobile-app-version:manage`
- Bloqueio de versão antiga no login e na abertura de turno

#### 🔐 Módulos e permissões mobile

- Cadastro de **módulos do app** e permissões por usuário mobile
- Login e refresh token passam a retornar permissões de módulos ao app

#### 📋 APR e turnos

- Visualização detalhada da APR preenchida no modal do turno
- Agrupamento de respostas APR por grupo de perguntas
- Novos campos de rastreamento de APR no sync mobile

#### 🏗️ Projetos (viabilização)

- Alinhamento do schema legado ao modelo atual de projetos
- Migration corretiva para ambientes com tabelas antigas (`ProjetoProgramacao`, etc.)

#### 🛠️ Operação e deploy

- Templates de `.env` e scripts de deploy para produção (`deploy/production/`)
- Comando `npm run snapshot:server` para diagnóstico do servidor
- Documentação de deploy PM2, uploads e auto-update mobile

### 🔧 Melhorias

- Sync de checklist na abertura de turno
- Campos extras em localização e categorização de eventos no upload mobile
- Melhor tratamento de medidas de controle "Outros" na APR
- Supressão de hints do `prisma generate` (`--no-hints`)
- Limite e mensagens de erro para upload de APK grande (até 200 MB na API)

### 🐛 Correções

- Build do Next.js na página de versões mobile (`dynamic` + Server Components)
- Mapeamento de permissão da rota `/dashboard/cadastro/mobile-app-version`
- Migration `MobileAppVersion` em bancos que não tinham a tabela criada

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
