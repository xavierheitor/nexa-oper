# Módulo de Autenticação

Módulo responsável por autenticação JWT (login e refresh) e integração com permissões por contrato.

---

## Visão geral

| Item       | Descrição                             |
| ---------- | ------------------------------------- |
| Estratégia | JWT (access + refresh tokens)         |
| Expiração  | Access: 7 dias, Refresh: 30 dias      |
| Usuários   | `MobileUser` (matrícula = `username`) |
| Storage    | Refresh tokens em `MobileToken`       |

---

## Arquitetura

```bash
AuthController
  -> LoginUseCase
  -> RefreshTokenUseCase

JwtStrategy
  -> ValidateAuthUserUseCase

UseCases
  -> AuthSessionRepositoryPort (token AUTH_SESSION_REPOSITORY)

AuthService (adapter)
  -> Prisma (MobileUser, MobileToken)

TokenPairFactory
  -> JwtService
```

### Responsabilidades

| Componente                | Responsabilidade                                    |
| ------------------------- | --------------------------------------------------- |
| `AuthController`          | Recebe `POST /auth/login` e `POST /auth/refresh`    |
| `LoginUseCase`            | Valida credenciais e emite par de tokens            |
| `RefreshTokenUseCase`     | Valida refresh, revoga token antigo, emite novo par |
| `ValidateAuthUserUseCase` | Resolve usuário ativo por ID para estratégia JWT    |
| `AuthService`             | Adaptador de persistência (porta de sessão/auth)    |
| `TokenPairFactory`        | Assinatura de JWTs e cálculo de expiração           |
| `JwtStrategy`             | Validação do JWT e preenchimento de `request.user`  |
| `JwtAuthGuard`            | Guard global que respeita `@Public()`               |

---

## Estrutura de pastas

```bash
auth/
├── application/
│   ├── services/
│   │   └── token-pair.factory.ts
│   └── use-cases/
│       ├── login.use-case.ts
│       ├── refresh-token.use-case.ts
│       └── validate-auth-user.use-case.ts
├── controllers/
│   └── auth.controller.ts
├── domain/
│   └── ports/
│       └── auth-session-repository.port.ts
├── dto/
│   ├── login.dto.ts
│   └── refresh.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
├── modules/
│   └── contract-permissions/
├── services/
│   └── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
└── auth.module.ts
```

---

## Fluxo de login

```bash
1. POST /auth/login { matricula, senha }
2. AuthController -> LoginUseCase
3. LoginUseCase
   - sessions.findActiveUserByMatricula(matricula)
   - bcrypt.compare(senha, user.password)
   - tokenPairFactory.issue(user)
   - sessions.storeRefreshToken(...)
4. Retorna { accessToken, refreshToken, expiresIn }
```

## Fluxo de refresh

```bash
1. POST /auth/refresh { refreshToken }
2. AuthController -> RefreshTokenUseCase
3. RefreshTokenUseCase
   - sessions.findValidRefreshToken(refreshToken)
   - sessions.revokeRefreshToken(tokenId)
   - tokenPairFactory.issue(user)
   - sessions.storeRefreshToken(...)
4. Retorna novo par { accessToken, refreshToken, expiresIn }
```

O refresh token é rotacionado a cada renovação.

## Fluxo em rotas protegidas

```bash
1. Requisição com Authorization: Bearer <accessToken>
2. JwtAuthGuard
   - @Public() => permite
   - caso contrário => Passport JWT
3. JwtStrategy
   - valida assinatura/expiração
   - ValidateAuthUserUseCase.execute(sub)
   - retorna { id, sub, username }
```

---

## Configuração

| Variável       | Obrigatória | Descrição                                       |
| -------------- | ----------- | ----------------------------------------------- |
| `JWT_SECRET`   | Sim         | Segredo para JWT (mín. 32 caracteres)           |
| `DATABASE_URL` | Sim         | Conexão com banco (`MobileUser`, `MobileToken`) |

Se `JWT_SECRET` tiver menos de 32 caracteres, o módulo falha na inicialização.

---

## Integrações

### ContractPermissionsModule

Usado para injeção de contratos/permissões em rotas que dependem de escopo contratual.

---

## Modelos Prisma usados

| Modelo        | Uso                                     |
| ------------- | --------------------------------------- |
| `MobileUser`  | Credenciais e identificação do usuário  |
| `MobileToken` | Persistência e rotação de refresh token |

---

## Boas práticas

1. Não logar tokens (`@LogOperation({ logOutput: false })` em login/refresh).
2. Mensagem genérica de autenticação inválida para evitar enumeração.
3. Rotacionar refresh token sempre que renovar access token.
4. Manter `JWT_SECRET` forte e isolado por ambiente.
