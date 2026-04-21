# Reconciliação de Escala vs. Turnos Realizados

O Nexa Oper possui um agendador automatizado na API (NodeCRON) projetado especificamente para verificar se os turnos previstos para uma equipe (*Escala*) não foram abertos de fato pelos usuários designados (*Eletricistas*). Quando uma inconsistência é encontrada, um registro em `Falta` é automaticamente lançado para análise pela gestão.

---

## 🧭 Como Funciona?

### 1. Disparo Temporal
O Daemon responsável pela vistoria (`TurnoEscalaReconcileJob`) está embarcado na própria inicialização da aplicação NestJS. Por padrão, todas as madrugadas (`02h00`), ele acorda para examinar registros.
- O job utilizará o cofre do banco de dados na entidade de `JobLock` (`jobName: "turno-escala-reconcile"`) como escudo anti-concorrência. Se duas instâncias da API estiverem ativas, apenas uma consegue obter o privilégio e processar, impedindo Faltas ou checagens duplicadas.

### 2. Parâmetros da Consulta (QueryRaw)
Para determinar quem mereceu uma falta, a consulta processa três características rigorosas:
- Recupera todos os `SlotEscala` que obrigatoriamente possuírem status de **Trabalho**, que ocorrem estritamente **antes da data de hoje** (de ontem para trás, sem mexer no dia em andamento).
- Assegura-se que ainda não foi gerada a respectiva lacuna em `Falta` com ligação àquela tabela.
- Assegura-se que a interseção deste Slot não contém nenhum `TurnoRealizadoEletricista` para aquele mesmo dia e mesmo CPF/ID.
  
Caso as 3 validações acima se encontrem "órfãs", a API preenche uma `Falta` com `{ motivoSistema: 'falta_abertura', status: 'pendente' }` assinada por um sistema de reconciliação de histórico.

### 3. A "Viagem ao Passado"
A beleza do Script reside na robustez dele para First-Runs (ou "inauguração" do sistema).
Se a variável estiver setada em `true` em um servidor novo, ele imediatamente resgatará todas as escalas do passado (desde 2024, por exemplo) para retro-preencher o banco gerando as justas pendências nos espelhos dos Eletricistas faltosos.

---

## ⚙️ Variáveis e Configurações

O controle da rotina é puramente gerido via `.env`:

```env
# Mantenha ligado no Servidor Principal que você deseja que compute o job, off caso seja um server espelho.
TURNO_RECONCILE_ENABLED=true  

# Frequência oficial. O formato aceita cron string universal (* * * * *). Ex: "0 2 * * *" = 2 da Manhã.
TURNO_RECONCILE_CRON="0 2 * * *"

# Trava que segura outros Nodes. Tempo em Millissegundos. Default: 10 minutos
TURNO_RECONCILE_LOCK_TTL_MS=600000
```

## 🐛 Solucionando Problemas (Troubleshooting)

- **Faltas Incorretas:** Se um supervisor abrir e fechar a escala após o Job já ter processado o dia de ontem, as faltas computadas não sumirão unicamente (visto que de fato no passado a abertura não ocorreu). É dever do Gestor entrar na interface Web e atribuir uma **Justificativa** (ex: Cancelou devido chuva) que zere aquela penalidade sem causar inconsistências de banco de dados no futuro. 
- **O Job não está rodando:** Certifique-se de que a API central tenha recebido a importação do `ScheduleModule` no módulo raiz. Verifique se o Timezone do EC2 / Hospedagem diverge do Timezone da Região (O CRON usa o Timezone da máquina Node).
