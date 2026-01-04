# 📊 Análise de Services e Actions - Plano de Padronização

## 🔍 Situação Atual

### Services Identificados: 35 services

#### ✅ Services que JÁ estendem AbstractCrudService (30 services)

- BaseService
- CargoService
- ContratoService
- EletricistaService
- EquipeService
- EquipeSupervisorService
- SupervisorService
- TipoAtividadeService
- TipoEquipeService
- TipoVeiculoService
- TurnoService
- UserService
- VeiculoService
- AprOpcaoRespostaService
- AprPerguntaService
- AprService
- AprTipoAtividadeVinculoService
- ChecklistOpcaoRespostaService
- ChecklistPendenciaService
- ChecklistPerguntaService
- ChecklistService
- ChecklistTipoEquipeVinculoService
- ChecklistTipoVeiculoVinculoService
- TipoChecklistService
- EquipeHorarioVigenciaService
- EquipeTurnoHistoricoService
- EscalaEquipePeriodoService
- HorarioAberturaCatalogoService
- TipoEscalaService
- TipoJustificativaService

#### ❌ Services que NÃO estendem AbstractCrudService (5 services)

1. **FaltaService** - Implementação simples, pode estender
2. **HoraExtraService** - Implementação simples, pode estender
3. **JustificativaEquipeService** - Implementação simples, pode estender
4. **JustificativaService** - Tem lógica específica (aprovar/rejeitar)
5. **MobileUserService** - Tem lógica específica (autenticação, senhas)

### ⚠️ Problemas Identificados

#### 1. Duplicação de Métodos

**Problema:** A maioria dos services que estendem `AbstractCrudService` está reimplementando o
método `list()` que já existe na classe abstrata.

**Exemplo:**

```typescript
// AbstractCrudService já tem:
async list(params: TFilter): Promise<PaginatedResult<T>> {
  const { items, total } = await this.repo.list(params);
  const totalPages = Math.ceil(total / params.pageSize);
  return { data: items, total, totalPages, page: params.page, pageSize: params.pageSize };
}

// Mas services como BaseService, CargoService, UserService estão duplicando:
async list(params: BaseFilter): Promise<PaginatedResult<Base>> {
  const { items, total } = await this.repo.list(params);
  const totalPages = Math.ceil(total / params.pageSize);
  return { data: items, total, totalPages, page: params.page, pageSize: params.pageSize };
}
```

**Impacto:** Código duplicado, violação do princípio DRY, manutenção mais difícil.

#### 2. Services sem Padrão

Alguns services não seguem o padrão estabelecido pelo `AbstractCrudService`.

### ✅ Pontos Positivos

#### Actions estão Bem Estruturadas

- ✅ Usam `handleServerAction` para padronização
- ✅ São wrappers simples que chamam services
- ✅ Não contêm lógica de negócio
- ✅ Bem documentadas
- ✅ Retornam `ActionResult<T>` padronizado

**Conclusão sobre Actions:** As actions estão limpas e não precisam de refatoração. Elas fazem
exatamente o que devem fazer: validar, autenticar e chamar o service.

---

## 📋 Plano de Padronização

### Fase 1: Remover Duplicação de Métodos `list()`

**Objetivo:** Remover implementações duplicadas de `list()`, `getById()`, `delete()` dos services
que estendem `AbstractCrudService`.

**Serviços afetados:** ~30 services

**Ação:**

- Remover método `list()` duplicado (AbstractCrudService já fornece)
- Remover método `getById()` duplicado se existir
- Remover método `delete()` duplicado se existir
- Manter apenas métodos `create()` e `update()` que são específicos

**Benefícios:**

- ✅ Reduz código duplicado
- ✅ Facilita manutenção (correções em um lugar só)
- ✅ Segue princípio DRY

### Fase 2: Migrar Services para AbstractCrudService

**Objetivo:** Fazer com que todos os services que podem estender `AbstractCrudService` o façam.

**Serviços a migrar:**

1. **FaltaService** ✅ Simples - pode estender
2. **HoraExtraService** ✅ Simples - pode estender
3. **JustificativaEquipeService** ✅ Simples - pode estender
4. **JustificativaService** ⚠️ Tem métodos específicos (aprovar/rejeitar) - pode estender mas manter
   métodos customizados
5. **MobileUserService** ⚠️ Tem lógica complexa (autenticação, senhas) - pode estender mas manter
   métodos customizados

**Estratégia:**

- Services podem estender `AbstractCrudService` e ainda ter métodos customizados
- Métodos específicos (aprovar, rejeitar, findByEmail, etc) podem coexistir com os métodos padrão

### Fase 3: Padronizar Documentação e Estrutura

**Objetivo:** Garantir que todos os services sigam o mesmo padrão de documentação e estrutura.

**Checklist:**

- ✅ Headers de documentação completos
- ✅ Comentários JSDoc em métodos públicos
- ✅ Tipos bem definidos
- ✅ Ordem consistente: constructor → create → update → delete → getById → list → métodos
  customizados

### Fase 4: Revisar Construtores

**Objetivo:** Padronizar a forma como services instanciam repositories.

**Padrão recomendado:**

```typescript
constructor() {
  super(new Repository());
}
```

**Evitar:**

```typescript
private repo: Repository;
constructor() {
  const repo = new Repository();
  super(repo);
  this.repo = repo; // Desnecessário se já está em `this.repo` da classe abstrata
}
```

---

## 🎯 Padrão Final Esperado

### Service Simples (CRUD Básico)

```typescript
export class BaseService extends AbstractCrudService<BaseCreate, BaseUpdate, BaseFilter, Base> {
  constructor() {
    super(new BaseRepository());
  }

  async create(data: BaseCreate, userId: string): Promise<Base> {
    // Validação e lógica específica
    return this.repo.create(data, userId);
  }

  async update(data: BaseUpdate, userId: string): Promise<Base> {
    // Validação e lógica específica
    return this.repo.update(data.id, data, userId);
  }

  // list(), getById(), delete() vêm da classe abstrata
}
```

### Service com Métodos Customizados

```typescript
export class JustificativaService extends AbstractCrudService<
  JustificativaCreate,
  JustificativaUpdate,
  JustificativaFilter,
  Justificativa
> {
  constructor() {
    super(new JustificativaRepository());
  }

  async create(data: JustificativaCreate, userId: string): Promise<Justificativa> {
    return this.repo.create(data, userId);
  }

  async update(data: JustificativaUpdate, userId: string): Promise<Justificativa> {
    return this.repo.update(data.id, data, userId);
  }

  // Métodos customizados específicos da entidade
  async aprovar(id: number, userId: string): Promise<Justificativa> {
    // Lógica específica
  }

  async rejeitar(id: number, userId: string): Promise<Justificativa> {
    // Lógica específica
  }

  // list(), getById(), delete() vêm da classe abstrata
}
```

---

## 📈 Benefícios da Padronização

1. **Consistência:** Todos os services seguem o mesmo padrão
2. **Manutenibilidade:** Mudanças em métodos comuns afetam todos os services automaticamente
3. **Redução de Código:** Menos código duplicado
4. **Facilidade de Uso:** Desenvolvedores sabem exatamente onde encontrar cada funcionalidade
5. **Testabilidade:** Padrão consistente facilita testes
6. **Qualidade:** Código mais limpo e elegante

---

## ✅ Resumo das Actions

**Conclusão:** As actions estão bem estruturadas e não precisam de refatoração.

- ✅ Padronizadas via `handleServerAction`
- ✅ Simples e diretas
- ✅ Bem documentadas
- ✅ Sem lógica de negócio (está nos services onde deve estar)

**Recomendação:** Manter actions como estão, focar em padronizar apenas os services.
