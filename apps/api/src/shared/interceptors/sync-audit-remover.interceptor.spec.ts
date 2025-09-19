/**
 * Testes para SyncAuditRemoverInterceptor
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { SyncAuditRemoverInterceptor } from './sync-audit-remover.interceptor';

describe('SyncAuditRemoverInterceptor', () => {
  let interceptor: SyncAuditRemoverInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new SyncAuditRemoverInterceptor();
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/api/apr/sync/modelos',
        }),
      }),
    } as ExecutionContext;

    mockCallHandler = {
      handle: () =>
        of({
          id: 1,
          nome: 'APR Teste',
          createdAt: '2024-01-15T10:30:00.000Z',
          createdBy: 'user123',
          updatedAt: '2024-01-20T09:00:00.000Z',
          updatedBy: 'user456',
          deletedAt: null,
          deletedBy: null,
        }),
    } as CallHandler;
  });

  it('deve remover campos de auditoria de rotas sync', done => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: result => {
        expect(result).toEqual({
          id: 1,
          nome: 'APR Teste',
        });
        expect(result.createdAt).toBeUndefined();
        expect(result.createdBy).toBeUndefined();
        expect(result.updatedAt).toBeUndefined();
        expect(result.updatedBy).toBeUndefined();
        expect(result.deletedAt).toBeUndefined();
        expect(result.deletedBy).toBeUndefined();
        done();
      },
    });
  });

  it('não deve processar rotas que não são sync', done => {
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/api/apr',
        }),
      }),
    } as ExecutionContext;

    const originalData = {
      id: 1,
      nome: 'APR Teste',
      createdAt: '2024-01-15T10:30:00.000Z',
      createdBy: 'user123',
    };

    mockCallHandler = {
      handle: () => of(originalData),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: result => {
        expect(result).toEqual(originalData);
        expect(result.createdAt).toBeDefined();
        expect(result.createdBy).toBeDefined();
        done();
      },
    });
  });

  it('deve processar arrays de objetos', done => {
    const arrayData = [
      {
        id: 1,
        nome: 'APR 1',
        createdAt: '2024-01-15T10:30:00.000Z',
        createdBy: 'user123',
      },
      {
        id: 2,
        nome: 'APR 2',
        createdAt: '2024-01-16T10:30:00.000Z',
        createdBy: 'user456',
      },
    ];

    mockCallHandler = {
      handle: () => of(arrayData),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: result => {
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, nome: 'APR 1' });
        expect(result[1]).toEqual({ id: 2, nome: 'APR 2' });
        expect(result[0].createdAt).toBeUndefined();
        expect(result[1].createdAt).toBeUndefined();
        done();
      },
    });
  });

  it('deve processar objetos aninhados', done => {
    const nestedData = {
      id: 1,
      nome: 'APR Teste',
      createdAt: '2024-01-15T10:30:00.000Z',
      createdBy: 'user123',
      relacionamento: {
        id: 2,
        nome: 'Relacionamento',
        createdAt: '2024-01-16T10:30:00.000Z',
        createdBy: 'user456',
      },
    };

    mockCallHandler = {
      handle: () => of(nestedData),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: result => {
        expect(result).toEqual({
          id: 1,
          nome: 'APR Teste',
          relacionamento: {
            id: 2,
            nome: 'Relacionamento',
          },
        });
        expect(result.createdAt).toBeUndefined();
        expect(result.relacionamento.createdAt).toBeUndefined();
        done();
      },
    });
  });
});
