# Módulo Escalas

O módulo de **Escalas** centraliza o controle das jornadas de eletricistas,
permitindo cadastrar diferentes padrões (como a escala espanhola e a escala 4x2),
atribuir colaboradores a cada horário e gerar agendas automáticas que serão
utilizadas pelo app durante a abertura de turnos.

## 📁 Estrutura de Pastas

```bash
escala/
├── constants/                 # Valores padrão e mensagens do domínio
├── controllers/               # Rotas REST (CRUD, agenda, alocações)
├── dto/                       # Contratos de entrada/saída documentados
├── services/                  # Regras de negócio e cálculos de agenda
├── escala.module.ts           # Declaração do módulo NestJS
└── README.md                  # Este guia
```

## 🚀 Principais Casos de Uso

1. **Cadastro de Escala** – Define ciclo, horários e limites de eletricistas.
2. **Alocação de Equipe** – Relaciona eletricistas aos horários com ordem de rotação.
3. **Geração de Agenda** – Calcula automaticamente quem deve trabalhar em cada dia.

## 🔌 Endpoints Disponíveis

| Método | Rota                 | Descrição                                     |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/escalas`           | Lista escalas com paginação e filtros         |
| GET    | `/escalas/:id`       | Detalhes completos de uma escala              |
| POST   | `/escalas`           | Cria nova escala com seus horários            |
| PUT    | `/escalas/:id`       | Atualiza dados básicos da escala              |
| DELETE | `/escalas/:id`       | Realiza soft delete da escala                 |
| POST   | `/escalas/:id/alocacoes` | Registra rotação de eletricistas         |
| GET    | `/escalas/:id/agenda`    | Gera agenda automática em um período     |

## 🧮 Como funciona a rotação 4x2

1. Cadastre a escala com `diasCiclo = 6` e horários exigindo dois eletricistas.
2. Atribua três eletricistas ao horário com ordens de rotação 0, 1 e 2.
3. A agenda calculará automaticamente quais dois devem trabalhar em cada dia.

## 📌 Dicas de Operação

- Utilize o campo `inicioCiclo` como âncora para alternar sábados na escala espanhola.
- `rotacaoOffset` permite deslocar a ordem inicial em turnos especiais.
- Os endpoints respeitam permissões de contrato, garantindo segurança multi-cliente.

## 🧪 Exemplos de Requisição

```bash
# Criar escala espanhola (ciclo de 14 dias)
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Escala Espanhola",
    "descricao": "Seg a Sex, sábado alternado, domingo folga",
    "contratoId": 5,
    "diasCiclo": 14,
    "minimoEletricistas": 2,
    "inicioCiclo": "2024-01-01T00:00:00.000Z",
    "horarios": [
      { "indiceCiclo": 0, "eletricistasNecessarios": 2 },
      { "indiceCiclo": 1, "eletricistasNecessarios": 2 },
      { "indiceCiclo": 5, "eletricistasNecessarios": 0, "folga": true },
      { "indiceCiclo": 6, "eletricistasNecessarios": 0, "folga": true }
    ]
  }' \
  "http://localhost:3001/api/escalas"
```

```bash
# Gerar agenda para janeiro
curl \
  -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/escalas/1/agenda?dataInicio=2024-01-01&dataFim=2024-01-31"
```

## 🧾 Auditoria

Todos os registros criados ou alterados recebem `createdBy`, `updatedBy` e
carimbos de data/hora seguindo o padrão adotado no restante da API.

---

> 💡 Mantenha este README sempre atualizado ao ajustar regras de negócio ou
> adicionar novos endpoints relacionados a escalas.
