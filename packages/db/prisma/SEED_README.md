# 🌱 Seed do Banco de Dados

Este arquivo contém dados mock completos para testar todos os recursos da aplicação.

## 📋 Dados Criados

O seed cria:

- **2 Contratos** (Norte e Sul)
- **2 Bases** (uma por contrato)
- **3 Cargos** (Eletricista de Linha, Eletricista de Rede, Eletricista Sênior)
- **2 Tipos de Veículo** (Caminhão, Van)
- **5 Veículos** (com placas diferentes)
- **2 Tipos de Equipe** (Manutenção, Instalação)
- **3 Equipes** (Alfa, Beta, Gama)
- **2 Supervisores** (João Silva, Maria Santos)
- **10 Eletricistas** (com matrículas, telefones, estados diferentes)
- **Tipos de Atividade e APRs** (Manutenção Preventiva, Instalação, Reparo)
- **Checklists** (com perguntas e opções de resposta)
- **Escalas** (4x2 para as equipes, últimos 30 dias e próximos 30 dias)
- **2 Turnos Abertos** (hoje, com eletricistas associados)
- **Checklists Preenchidos** (com respostas e pendências)
- **Turnos Realizados** (histórico dos últimos 7 dias)
- **Faltas e Justificativas** (com atestado médico)
- **Horas Extras** (aprovadas)
- **Divergências de Escala** (equipe divergente)
- **Catálogo de Horários** (presets de horários de turno)

## 🚀 Como Usar

### Instalar dependências (se necessário)

```bash
cd packages/db
npm install
```

### Executar o seed

```bash
# Na raiz do projeto
npm run dev


# Ou diretamente no pacote db
cd packages/db
npm run seed
```

### Executar via Prisma

O Prisma também pode executar o seed automaticamente:

```bash
# Reset do banco + seed automático
npm run db:reset --workspace=packages/db
```

## 📊 Estatísticas dos Dados

Após executar o seed, você terá:

- ✅ **2 turnos abertos** (hoje) para testar funcionalidades de turno
- ✅ **7+ turnos realizados** (histórico) para calcular percentuais
- ✅ **Escalas completas** (60 dias: 30 passados + 30 futuros)
- ✅ **Faltas justificadas** para testar sistema de justificativas
- ✅ **Checklists preenchidos** com pendências para testar workflow
- ✅ **Horas extras** para testar aprovações
- ✅ **Divergências** para testar relatórios

## 🎯 Dados para Teste

### Turnos Abertos

- **Turno 1**: Equipe Alfa, Veículo ABC1234, 2 eletricistas
- **Turno 2**: Equipe Beta, Veículo DEF5678, 2 eletricistas

### Eletricistas

- **MAT0001** a **MAT0010** (10 eletricistas)
- Distribuídos entre os contratos
- Diferentes cargos e estados

### Escalas

- **Escala 4x2** (4 dias trabalho, 2 dias folga)
- Período: últimos 30 dias + próximos 30 dias
- Horário padrão: 06:00 às 14:00

### Percentual de Turnos Executados

O seed cria turnos realizados para os últimos 7 dias, permitindo calcular:

- Percentual de execução por equipe
- Percentual de execução por eletricista
- Percentual de execução por período

## ⚠️ Observações

- O seed usa `seed-script` como `createdBy` e `updatedBy`
- Todas as datas são relativas à data atual
- Os dados são criados de forma sequencial respeitando dependências
- O seed pode ser executado múltiplas vezes (mas pode gerar duplicatas se não limpar antes)

## 🔄 Limpar e Recriar

Para limpar o banco e recriar com seed:

```bash
npm run db:reset --workspace=packages/db
```

Isso vai:

1. Resetar o banco de dados
2. Aplicar todas as migrações
3. Executar o seed automaticamente
