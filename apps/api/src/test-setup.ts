/**
 * Configuração de setup para testes Jest
 *
 * Este arquivo configura o ambiente de testes para evitar conflitos
 * com logs do NestJS e garantir que os testes executem corretamente.
 *
 * @author Nexa Oper Team
 * @since 1.0.0
 */

// Suprime logs do console durante os testes para evitar conflitos com Jest
const originalConsole = global.console;

beforeAll(() => {
  // Redireciona logs do NestJS para evitar conflitos com Jest
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterAll(() => {
  // Restaura console original após os testes
  global.console = originalConsole;
});

// Configuração global para testes
beforeEach(() => {
  // Limpa todos os mocks antes de cada teste
  jest.clearAllMocks();
});

// Configuração de timeout para testes
jest.setTimeout(10000);
