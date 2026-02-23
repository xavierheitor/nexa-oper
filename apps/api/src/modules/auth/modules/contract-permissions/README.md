# Módulo Contract Permissions

Controle de permissões por contrato para usuários mobile, com cache em memória e integração transparente via guard/interceptor.

## Arquitetura

- Decorators: metadata e extração de parâmetros
- `ContractPermissionsGuard`: valida permissão por contrato
- `UserContractsInterceptor`: injeta contratos do usuário na requisição
- Use cases:
  - `HasContractPermissionUseCase`
  - `HasAnyContractPermissionUseCase`
  - `GetUserContractsUseCase`
- Porta: `ContractPermissionsReaderPort`
- Adapter: `ContractPermissionsService` (Prisma + cache TTL 60s)

## Decorators principais

- `@GetUsuarioMobileId()`
- `@InjectUserContracts()`
- `@ListUserContracts()`
- `@GetUserContracts()`
- `@GetUserContractsInfo()`
- `@RequireContractPermission(paramName)`
- `@RequireAnyContractPermission(paramName)`
- `@RequireAllContractPermissions(paramName)`
- `@OptionalContractPermission(paramName)`
- `@CustomContractPermission(paramName, options)`

## Origem dos parâmetros de contrato

Ordem de resolução no guard:

1. `request.params[paramName]`
2. `request.query[paramName]`
3. `request.body` via `bodyPath`

## Modos de validação

- `single`: usuário precisa de permissão no contrato informado
- `any`: usuário precisa de permissão em pelo menos um contrato da lista
- `all`: usuário precisa de permissão em todos os contratos da lista

## Exemplos

```ts
@ListUserContracts()
@Get('meus-contratos')
list(@GetUserContracts() contracts: number[]) {
  return { contracts };
}

@RequireContractPermission('contratoId')
@Get('contratos/:contratoId')
findOne(@Param('contratoId') contratoId: number) {
  return { contratoId };
}

@RequireAnyContractPermission('contratoIds', { bodyPath: 'contratoIds' })
@Post('batch')
batch(@Body() body: { contratoIds: number[] }) {
  return { requested: body.contratoIds };
}
```

## Cache

- Chave single: `perm:<userId>:<contractId>`
- Chave lista: `contracts:<userId>`
- TTL: 60 segundos

Métodos de invalidação disponíveis no adapter:

- `invalidateUserCache(userId)`
- `invalidateAllCache()`
