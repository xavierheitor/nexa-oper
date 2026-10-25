import {
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { AppLogger } from '../logger/app-logger';
import { AppError } from './app-error';
import { captureUnexpected } from '../monitoring';
jest.mock('../monitoring', () => ({ captureUnexpected: jest.fn() }));

describe('GlobalExceptionFilter monitoring', () => {
  const log = { error: jest.fn(), warn: jest.fn() };
  beforeEach(() => jest.clearAllMocks());
  function invoke(error: unknown) {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = {
      url: '/items/123?private=value',
      method: 'GET',
      headers: {},
      route: { path: '/items/:id' },
    };
    const host = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    } as unknown as ArgumentsHost;
    new GlobalExceptionFilter(log as unknown as AppLogger).catch(error, host);
    return res;
  }
  it('captures unexpected errors once with normalized route and preserves the response', () => {
    const error = new Error('internal');
    const res = invoke(error);
    expect(captureUnexpected).toHaveBeenCalledTimes(1);
    expect(captureUnexpected).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        'http.route': '/items/:id',
        'http.method': 'GET',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL',
        path: '/items/123?private=value',
      }),
    );
  });
  it.each([
    new BadRequestException('invalid'),
    new UnauthorizedException(),
    AppError.forbidden('forbidden'),
  ])('excludes expected error %s', (error) => {
    const res = invoke(error);
    expect(captureUnexpected).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(
      error instanceof AppError ? error.status : error.getStatus(),
    );
  });
});
