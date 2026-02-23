# Sistema de Logging Robusto - Guia Completo

## Visão Geral

Implementamos um sistema de logging estruturado e robusto que substitui todos os `console.log` por logging adequado, com tratamento de erros estruturado e sanitização automática de dados sensíveis.

## Componentes do Sistema

### 1. StandardLogger
Logger base com métodos especializados para diferentes tipos de operação.

```typescript
import { StandardLogger } from '@common/utils/logger';

const logger = new StandardLogger('MeuServico');

// Logs básicos
logger.log('Operação realizada');
logger.debug('Debug info');
logger.warn('Aviso importante');
logger.error('Erro crítico');

// Logs especializados
logger.operation('Criando usuário');
logger.validation('Validando dados');
logger.database('Executando query');
logger.auth('Autenticando usuário');
```

### 2. Logging Estruturado com Contexto

```typescript
import { logOperationWithContext, logErrorStructured, LogContext } from '@common/utils/logger';

const context: LogContext = {
  userId: '123',
  requestId: 'req_abc123',
  operation: 'createUser',
  module: 'UserService',
  metadata: { additionalInfo: 'value' }
};

// Log de operação com contexto
logOperationWithContext(
  logger,
  'Criando novo usuário',
  context,
  userData // Dados sanitizados automaticamente
);

// Log de erro estruturado
logErrorStructured(
  logger,
  'Falha ao criar usuário',
  error,
  context
);
```

### 3. Decorator @LogOperation

Aplicar logging automático em métodos:

```typescript
import { LogOperation } from '@common/decorators/log-operation.decorator';

@LogOperation({
  operation: 'createUser',
  logInput: true,    // Logar dados de entrada
  logOutput: false,  // Não logar dados de saída (tokens, etc)
  measureTime: true, // Medir tempo de execução
})
async createUser(userData: CreateUserDto) {
  // implementação
}
```

### 4. Interceptors Globais

- **ErrorLoggingInterceptor**: Captura erros automaticamente
- **OperationLoggingInterceptor**: Aplica @LogOperation automaticamente

## Substituições Realizadas

### ✅ Console.log → Logger
- `apps/api/src/main.ts` - Bootstrap e cleanup de porta
- `apps/api/src/common/middleware/logger.middleware.ts` - Middleware de logging
- `apps/api/src/modules/engine/auth/services/auth.service.ts` - Erro de refresh token

### ✅ Sistema de Sanitização
- Headers sensíveis mascarados (`authorization`, `cookie`, etc)
- Campos sensíveis mascarados (`password`, `token`, `secret`, etc)
- Sanitização recursiva em objetos aninhados

### ✅ Logging Estruturado
- Contexto completo (userId, requestId, operation, module)
- Metadados enriquecidos (IP, User-Agent, URL, etc)
- Timestamps e rastreamento de requisições

## Exemplos de Uso

### Em Serviços
```typescript
@Injectable()
export class UserService {
  private readonly logger = new StandardLogger(UserService.name);

  async createUser(userData: CreateUserDto) {
    const context: LogContext = {
      operation: 'createUser',
      module: 'UserService',
      metadata: { email: userData.email }
    };

    try {
      logOperationWithContext(
        this.logger,
        'Iniciando criação de usuário',
        context,
        userData
      );

      const user = await this.databaseService.getPrisma().user.create({
        data: userData
      });

      logOperationWithContext(
        this.logger,
        'Usuário criado com sucesso',
        context,
        { id: user.id }
      );

      return user;
    } catch (error) {
      logErrorStructured(
        this.logger,
        'Falha ao criar usuário',
        error,
        context
      );
      throw error;
    }
  }
}
```

### Em Controladores
```typescript
@Controller('users')
export class UserController {
  @Post()
  @LogOperation({
    operation: 'createUser',
    logInput: true,
    logOutput: false,
    measureTime: true
  })
  async create(@Body() userData: CreateUserDto) {
    return this.userService.createUser(userData);
  }
}
```

## Benefícios

### 🔒 Segurança
- Dados sensíveis automaticamente mascarados
- Headers de autenticação protegidos
- Senhas e tokens nunca aparecem nos logs

### 📊 Observabilidade
- Logs estruturados para análise
- Rastreamento de requisições completo
- Medição de performance automática

### 🐛 Debugging
- Contexto completo em cada log
- Stack traces estruturados
- Rastreamento de operações por usuário

### ⚡ Performance
- Logging assíncrono
- Níveis de log por ambiente
- Sanitização otimizada

## Configuração por Ambiente

### Desenvolvimento
- Todos os níveis de log habilitados
- Logs detalhados de validação e banco
- Sanitização completa

### Produção
- Apenas ERROR, WARN e LOG
- Logs de operação essenciais
- Sanitização rigorosa

## Monitoramento

Os logs estruturados podem ser facilmente integrados com:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Loki
- CloudWatch (AWS)
- Azure Monitor

## Próximos Passos

1. **Aplicar @LogOperation** em controladores críticos
2. **Migrar console.log restantes** para StandardLogger
3. **Configurar agregação de logs** em produção
4. **Implementar alertas** baseados em logs de erro
5. **Adicionar métricas** de performance baseadas em logs

## Arquivos Criados/Modificados

- `apps/api/src/common/utils/logger.ts` - Sistema de logging expandido
- `apps/api/src/common/interceptors/error-logging.interceptor.ts` - Interceptor de erros
- `apps/api/src/common/interceptors/operation-logging.interceptor.ts` - Interceptor de operações
- `apps/api/src/common/decorators/log-operation.decorator.ts` - Decorator de logging
- `apps/api/src/app.module.ts` - Interceptors globais registrados
- `apps/api/src/main.ts` - Console.log substituído por Logger
- `apps/api/src/common/middleware/logger.middleware.ts` - Console.log substituído
- `apps/api/src/modules/engine/auth/controllers/auth.controller.ts` - Exemplo de uso
