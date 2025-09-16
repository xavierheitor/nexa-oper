/**
 * Testes unitários para AppController
 *
 * Este arquivo contém os testes para o controlador principal da aplicação,
 * verificando se os endpoints de informações da API, health check e versão
 * estão funcionando corretamente.
 *
 * @author Nexa Oper Team
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db/db.service';

/**
 * Mock do DbService para testes isolados
 *
 * Simula o comportamento do serviço de banco de dados
 * sem necessidade de conexão real durante os testes.
 */
const mockDbService = {
  healthCheck: jest.fn().mockResolvedValue(true),
};

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  /**
   * Configuração executada antes de cada teste
   *
   * Cria um módulo de teste isolado com mocks dos serviços
   * necessários para testar o AppController.
   */
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  /**
   * Testes para o endpoint de informações da aplicação
   */
  describe('getAppInfo', () => {
    it('should return application information', () => {
      const result = appController.getAppInfo();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('startedAt');
      expect(result.name).toBe('Nexa Oper API');
    });
  });

  /**
   * Testes para o endpoint de health check
   */
  describe('getHealthCheck', () => {
    it('should return health status', async () => {
      const result = await appController.getHealthCheck();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database');
      expect(['healthy', 'unhealthy']).toContain(result.status);
    });

    it('should handle database connection failure', async () => {
      // Mock falha na conexão do banco
      mockDbService.healthCheck.mockResolvedValueOnce(false);

      const result = await appController.getHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database).toBe('disconnected');
    });
  });

  /**
   * Testes para o endpoint de versão
   */
  describe('getVersion', () => {
    it('should return version information', () => {
      const result = appController.getVersion();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('version');
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    });
  });

  /**
   * Testes de integração com AppService
   */
  describe('service integration', () => {
    it('should use AppService for health check', async () => {
      const spy = jest.spyOn(appService, 'getHealthCheck');

      await appController.getHealthCheck();

      expect(spy).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should use AppService for app info', () => {
      const spy = jest.spyOn(appService, 'getAppInfo');

      appController.getAppInfo();

      expect(spy).toHaveBeenCalled();
    });

    it('should use AppService for version', () => {
      const spy = jest.spyOn(appService, 'getVersion');

      appController.getVersion();

      expect(spy).toHaveBeenCalled();
    });
  });
});
