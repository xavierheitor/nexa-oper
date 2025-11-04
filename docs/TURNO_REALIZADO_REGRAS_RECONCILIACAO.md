# Regras de Negócio: Reconciliação de Turnos

## Objetivo
Documentar todas as regras de negócio para reconciliação de turnos realizados vs. escala planejada.

## Fluxo Principal

### 1. Abertura de Turno
Quando um turno é aberto via `TurnoRealizadoService.abrirTurno()`:
1. Cria `TurnoRealizado`
2. Cria `TurnoRealizadoEletricista` para cada eletricista
3. **Dispara reconciliação assíncrona** (não bloqueia resposta)

### 2. Reconciliação Automática
Executada imediatamente após abertura (assíncrona) ou via job diário às 23h.

## Matriz de Decisão

### Caso 1: Escala TRABALHO + Eletricista ABRIU turno na mesma equipe
**Resultado**: ✅ **Normal**
- Sem ação adicional
- Registro fica apenas em `TurnoRealizadoEletricista`

### Caso 2: Escala TRABALHO + Eletricista NÃO ABRIU turno
**Resultado**: ❌ **FALTA**
- Criar registro em `Falta`:
  - `motivoSistema`: `falta_abertura`
  - `status`: `pendente`
  - `escalaSlotId`: ID do slot da escala
  - `dataReferencia`: Data do slot
  - `equipeId`: Equipe da escala
  - `eletricistaId`: Eletricista escalado

**Exceção**: Se eletricista tem status `FERIAS`, `LICENCA_MEDICA`, etc. (verificar `EletricistaStatus.status`), pode criar falta com observação diferente.

### Caso 3: Escala TRABALHO + Eletricista ABRIU em EQUIPE DIFERENTE
**Resultado**: ⚠️ **DIVERGÊNCIA**
- Criar registro em `DivergenciaEscala`:
  - `tipo`: `equipe_divergente`
  - `equipePrevistaId`: Equipe da escala
  - `equipeRealId`: Equipe onde realmente abriu
  - `eletricistaId`: Eletricista
  - `detalhe`: Opcional

**Não criar falta**: Pois o eletricista trabalhou, apenas em equipe diferente.

### Caso 4: Escala FOLGA + Eletricista ABRIU turno
**Resultado**: 💰 **HORA EXTRA (folga_trabalhada)**
- Criar registro em `HoraExtra`:
  - `tipo`: `folga_trabalhada`
  - `horasPrevistas`: 0 (folga)
  - `horasRealizadas`: Calcular de `abertoEm` até `fechadoEm`
  - `diferencaHoras`: `horasRealizadas` (já que previsto é 0)
  - `escalaSlotId`: ID do slot de folga
  - `status`: `pendente`

**Observação**: Permitir trabalho em folga (não bloquear), mas registrar como hora extra.

### Caso 5: Escala FOLGA + Eletricista NÃO ABRIU turno
**Resultado**: ✅ **Normal (folga)**
- Sem ação adicional
- Folga é esperada

### Caso 6: Sem Escala + Eletricista ABRIU turno
**Resultado**: 💰 **HORA EXTRA (extrafora)**
- Criar registro em `HoraExtra`:
  - `tipo`: `extrafora`
  - `horasPrevistas`: 0 (sem escala)
  - `horasRealizadas`: Calcular de `abertoEm` até `fechadoEm`
  - `diferencaHoras`: `horasRealizadas`
  - `status`: `pendente`

**Observação**: Trabalho fora da escala planejada.

### Caso 7: Escala TRABALHO + Eletricista ABRIU COM ATRASO
**Resultado**: ⏰ **Verificar compensação**
- Se `abertoEm` > `inicioPrevisto + 30min`:
  - Se `fechadoEm` compensou (trabalhou mais horas):
    - Criar `HoraExtra`:
      - `tipo`: `atraso_compensado`
      - `horasPrevistas`: Calcular da escala
      - `horasRealizadas`: Calcular do turno
      - `diferencaHoras`: `horasRealizadas - horasPrevistas`
      - `status`: `pendente` (aguardar aprovação)
  - Se não compensou:
    - Criar `Falta` parcial ou criar `DivergenciaEscala` com tipo `atraso_nao_compensado` (se necessário)

**Margem de tolerância**: 30 minutos após `inicioPrevisto`.

### Caso 8: Troca de Folga
**Cenário**: Eletricista A estava de folga, mas Eletricista B abriu turno (possível troca)
**Resultado**: 💰 **HORA EXTRA (troca_folga)** para Eletricista B
- Criar registro em `HoraExtra`:
  - `tipo`: `troca_folga`
  - `horasPrevistas`: 0 (B não tinha escala)
  - `horasRealizadas`: Calcular do turno de B
  - `diferencaHoras`: `horasRealizadas`
  - `observacoes`: "Possível troca com Eletricista A"
  - `status`: `pendente` (aguardar confirmação manual)

**Observação**: Troca precisa ser validada manualmente, mas sistema registra como hora extra.

## Cálculo de Horas

### Horas Previstas
1. Buscar `SlotEscala.inicioPrevisto` e `fimPrevisto`
2. Se não houver, buscar de `EquipeTurnoHistorico` (configuração padrão da equipe)
3. Calcular: `fimPrevisto - inicioPrevisto` (considerar intervalo se houver)
4. Se nenhum disponível: `0`

### Horas Realizadas
1. Buscar `TurnoRealizadoEletricista.abertoEm` e `fechadoEm`
2. Calcular: `fechadoEm - abertoEm` (em horas)
3. Se `fechadoEm` for `null` (turno ainda aberto), usar hora atual ou `null`

### Diferença de Horas
- `diferencaHoras = horasRealizadas - (horasPrevistas || 0)`
- Se negativo: Não é hora extra (pode ser atraso/falta parcial)
- Se positivo: É hora extra

## Validações Adicionais

### Status do Eletricista
Antes de criar falta, verificar `EletricistaStatus.status`:
- Se `FERIAS`, `LICENCA_MEDICA`, etc.: Não criar falta (ou criar com motivo diferente)
- Se `ATIVO`: Criar falta normalmente

### Idempotência
- Usar `@@unique` constraints para evitar duplicatas
- Usar `.catch(() => {})` em `create` para ignorar erros de duplicata

### Job Diário (23h)
1. Reconcilia todos os dias dos últimos 30 dias
2. Para cada dia, verifica se há turnos que não foram abertos
3. Aguarda 30 minutos após `inicioPrevisto` antes de marcar como falta
4. Processa apenas dias que ainda não foram reconciliados (ou reconciliados antes das 23h)

## Exemplos Práticos

### Exemplo 1: Falta Normal
```
Escala: 2024-01-15, Eletricista 1, TRABALHO, 08:00-17:00
Real: Eletricista 1 não abriu turno

Ação: Criar Falta
- motivoSistema: falta_abertura
- status: pendente
```

### Exemplo 2: Folga Trabalhada
```
Escala: 2024-01-15, Eletricista 2, FOLGA
Real: Eletricista 2 abriu turno 08:00-17:00

Ação: Criar HoraExtra
- tipo: folga_trabalhada
- horasPrevistas: 0
- horasRealizadas: 9.0
- diferencaHoras: 9.0
```

### Exemplo 3: Divergência de Equipe
```
Escala: 2024-01-15, Eletricista 3, TRABALHO, Equipe A
Real: Eletricista 3 abriu turno na Equipe B

Ação: Criar DivergenciaEscala
- tipo: equipe_divergente
- equipePrevistaId: A
- equipeRealId: B
```

### Exemplo 4: Atraso Compensado
```
Escala: 2024-01-15, Eletricista 4, TRABALHO, 08:00-17:00 (9h)
Real: Eletricista 4 abriu 09:00 (1h atraso), fechou 18:00 (9h trabalhadas)

Ação: Criar HoraExtra
- tipo: atraso_compensado
- horasPrevistas: 9.0
- horasRealizadas: 9.0
- diferencaHoras: 0.0 (compensou)
```

### Exemplo 5: Trabalho Extrafora
```
Escala: Nenhuma para Eletricista 5 em 2024-01-20
Real: Eletricista 5 abriu turno 08:00-16:00

Ação: Criar HoraExtra
- tipo: extrafora
- horasPrevistas: 0
- horasRealizadas: 8.0
- diferencaHoras: 8.0
```

## Performance

- Processamento assíncrono (não bloqueia resposta da API)
- Usar Map para agregações O(n)
- Índices adequados para consultas rápidas
- Job diário processa em batch (últimos 30 dias)

## Observações Importantes

1. **Reconciliação é idempotente**: Pode executar múltiplas vezes sem duplicar registros
2. **Margem de 30min**: Job diário aguarda 30min após horário previsto antes de marcar falta
3. **Status do eletricista**: Considerar status (ferias, licença) antes de criar falta
4. **Folgas permitidas**: Trabalhar em folga não é bloqueado, apenas registrado como hora extra

