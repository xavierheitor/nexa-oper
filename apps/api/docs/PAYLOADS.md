# Contratos e Payloads

## Autenticação

- `POST /api/auth/login`

```json
{
  "matricula": "user123",
  "senha": "senha123"
}
```

Erros de validação seguem o padrão do `ValidationErrorInterceptor`.

## Turnos (Web)

- `POST /api/turnos/abrir`

```json
{
  "veiculoId": 1,
  "equipeId": 1,
  "dispositivo": "SM-G973F-001",
  "dataInicio": "2024-01-01T08:00:00.000Z",
  "kmInicio": 50000,
  "eletricistas": [{ "eletricistaId": 1 }]
}
```

- `POST /api/turnos/fechar`

```json
{
  "turnoId": 1,
  "dataFim": "2024-01-01T17:00:00.000Z",
  "kmFim": 50120
}
```

## Turnos (Mobile)

- `POST /api/turno/abrir` Exemplo resumido (ver documento de análise completo em
  `docs/ANALISE_MODULO_TURNOS_MOBILE.md`):

```json
{
  "turno": {
    "idLocal": 123,
    "veiculoId": 456,
    "equipeId": 789,
    "kmInicial": 1000,
    "horaInicio": "2024-01-15T08:00:00Z",
    "deviceId": "ABC123"
  },
  "eletricistas": [ { "remoteId": 101, "motorista": true } ],
  "checklists": [ ... ]
}
```

## DTOs e Validações

- DTOs utilizam `class-validator` e são transformados/validados globalmente via `ValidationPipe`.
- Exemplos:
  - `CreateAprDto` (APR)
  - `CreateChecklistDto` (Checklist)
  - `LoginDto` (Auth)
  - `AbrirTurnoDto` e `FecharTurnoDto` (Turno)
