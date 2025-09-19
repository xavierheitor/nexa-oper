/**
 * Configuração do Jest para API Nexa Oper
 *
 * Esta configuração garante que o Jest funcione corretamente com TypeScript,
 * usando ts-jest como transformador e configurações específicas para o
 * ambiente de testes da API.
 *
 * @author Nexa Oper Team
 * @since 1.0.0
 */

module.exports = {
  // Extensões de arquivo que o Jest deve processar
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Diretório raiz para os testes
  rootDir: 'src',

  // Padrão regex para identificar arquivos de teste
  testRegex: '.*\\.spec\\.ts$',

  // Configuração de transformadores
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        // Usa o tsconfig específico para testes
        tsconfig: './tsconfig.spec.json',
      },
    ],
  },

  // Diretório para relatórios de cobertura
  coverageDirectory: '../coverage',

  // Ambiente de teste
  testEnvironment: 'node',

  // Mapeamento de módulos para resolução de imports
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },

  // Timeout para testes
  testTimeout: 10000,

  // Limpar mocks automaticamente entre testes
  clearMocks: true,

  // Restaurar mocks automaticamente entre testes
  restoreMocks: true,

  // Configurações de cobertura
  coverageReporters: ['text', 'lcov', 'html'],

  // Limite mínimo de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Arquivos de setup executados após o ambiente ser configurado
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],

  // Padrões de arquivos/diretórios a serem ignorados
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Transformações a serem ignoradas
  transformIgnorePatterns: ['/node_modules/'],

  // Configurações do ts-jest
  globals: {},

  // Configuração para suporte a ESM se necessário
  extensionsToTreatAsEsm: [],

  // Configuração verbose para logs detalhados
  verbose: false,

  // Configurações para evitar conflitos com logs do NestJS
  silent: false,

  // Configuração para capturar logs
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
    '!**/test-setup.ts',
  ],

  // Configuração para evitar problemas com stdout/stderr
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};
