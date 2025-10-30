# Testes Pendentes - Módulos de Turnos e Justificativas

## 📋 Status do Commit
- ✅ Commit realizado: `ee543e8`
- ✅ Push para origin/main concluído
- ✅ Banco de dados: `nexa_oper_template` sincronizado

## 🔗 Endpoints para Testar

### Módulo: Turno Realizado (`/api/turnos`)

#### 1. Abrir Turno
```
POST /api/turnos/aberturas
Content-Type: application/json

{
  "equipeId": 1,
  "dataReferencia": "2024-10-30",
  "eletricistasAbertos": [
    {
      "eletricistaId": 1,
      "abertoEm": "2024-10-30T08:00:00Z",
      "deviceInfo": "Samsung S21"
    }
  ],
  "origem": "mobile",
  "executadoPor": "operador123"
}
```

#### 2. Fechar Turno
```
POST /api/turnos/:turnoId/fechamento
Content-Type: application/json

{
  "executadoPor": "operador123"
}
```

#### 3. Resumo de Turnos
```
GET /api/turnos/resumo?data=2024-10-30&equipe=1
```

---

### Módulo: Justificativas

#### 1. Tipos de Justificativa

##### Listar Tipos
```
GET /api/tipos-justificativa
```

##### Criar Tipo
```
POST /api/tipos-justificativa
Content-Type: application/json

{
  "nome": "Atestado Médico",
  "descricao": "Falta justificada com atestado médico",
  "ativo": true,
  "createdBy": "admin123"
}
```

##### Atualizar Tipo
```
PATCH /api/tipos-justificativa/:id
Content-Type: application/json

{
  "nome": "Atestado Médico Atualizado",
  "ativo": false,
  "updatedBy": "admin123"
}
```

#### 2. Justificativas

##### Criar Justificativa
```
POST /api/faltas/:faltaId/justificativas
Content-Type: application/json

{
  "tipoId": 1,
  "descricacao": "Faltou por motivo de atestado médico",
  "createdBy": "eletricista456"
}
```

##### Aprovar Justificativa
```
POST /api/justificativas/:id/aprovar
Content-Type: application/json

{
  "decididoPor": "supervisor789"
}
```

##### Rejeitar Justificativa
```
POST /api/justificativas/:id/rejeitar
Content-Type: application/json

{
  "decididoPor": "supervisor789"
}
```

---

## 🧪 Cenários de Teste

### Fluxo Completo: Abertura e Fechamento de Turno
1. Criar equipe (se não existir)
2. Criar eletricistas (se não existirem)
3. **POST** `/api/turnos/aberturas` - Abrir turno para equipe
4. Verificar resumo: **GET** `/api/turnos/resumo?data=2024-10-30&equipe=1`
5. **POST** `/api/turnos/:turnoId/fechamento` - Fechar turno

### Fluxo Completo: Justificativas
1. Criar tipo de justificativa: **POST** `/api/tipos-justificativa`
2. Verificar tipos criados: **GET** `/api/tipos-justificativa`
3. Criar falta manualmente no banco (ou via endpoint futuro)
4. Criar justificativa: **POST** `/api/faltas/:faltaId/justificativas`
5. Aprovar justificativa: **POST** `/api/justificativas/:id/aprovar`
6. Verificar se falta foi atualizada para status 'justificada'

---

## ⚠️ Validações Pendentes
- [ ] DTOs com class-validator não foram implementados
- [ ] Validação de ids e referências no banco
- [ ] Testes unitários dos services
- [ ] Testes de integração dos endpoints
- [ ] Autenticação/autorização nos endpoints
- [ ] Rate limiting aplicado

---

## 📝 Observações
- Endpoints estão sem autenticação por enquanto
- Dados de `executadoPor` e `createdBy` aceitam qualquer string
- Falta implementar endpoints para criação de faltas manualmente
- Swagger disponível em `/api/docs` para documentação interativa

