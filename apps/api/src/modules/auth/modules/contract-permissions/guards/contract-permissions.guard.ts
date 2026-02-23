import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../../../../../core/errors/app-error';
import {
  CONTRACT_PERMISSION_KEY,
  LIST_USER_CONTRACTS_KEY,
  type ContractPermissionOptions,
} from '../constants';
import { HasContractPermissionUseCase } from '../application/use-cases/has-contract-permission.use-case';
import { HasAnyContractPermissionUseCase } from '../application/use-cases/has-any-contract-permission.use-case';
import { GetUserContractsUseCase } from '../application/use-cases/get-user-contracts.use-case';

interface GuardRequest {
  user?: { id?: number; sub?: number };
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

@Injectable()
export class ContractPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly hasContractPermissionUseCase: HasContractPermissionUseCase,
    private readonly hasAnyContractPermissionUseCase: HasAnyContractPermissionUseCase,
    private readonly getUserContractsUseCase: GetUserContractsUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const listOnly = this.reflector.getAllAndOverride<boolean>(
      LIST_USER_CONTRACTS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (listOnly) return true;

    const options = this.reflector.getAllAndOverride<ContractPermissionOptions>(
      CONTRACT_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const user = request.user;
    if (!user) {
      throw AppError.unauthorized('Usuário não autenticado');
    }

    const userId = user.id ?? user.sub;
    if (userId == null) {
      throw AppError.unauthorized('ID do usuário não encontrado');
    }

    const value = this.extractParam(request, options);
    const required = options.required !== false;

    if (value == null) {
      if (required) {
        throw AppError.forbidden(
          `Parâmetro obrigatório '${options.paramName}' não informado`,
        );
      }
      return true;
    }

    if (options.mode === 'single') {
      const contractId = this.toNumber(value);
      if (Number.isNaN(contractId)) {
        throw AppError.forbidden(
          `Parâmetro '${options.paramName}' deve ser um ID válido`,
        );
      }
      const has = await this.hasContractPermissionUseCase.execute(
        userId,
        contractId,
      );
      if (!has) throw AppError.forbidden('Sem permissão para este contrato');
      return true;
    }

    if (options.mode === 'any') {
      const ids = this.toNumberArray(value);
      if (ids == null) {
        throw AppError.forbidden(
          `Parâmetro '${options.paramName}' deve conter IDs válidos`,
        );
      }
      if (ids.length === 0 && required) {
        throw AppError.forbidden(
          `Parâmetro '${options.paramName}' deve conter ao menos um ID`,
        );
      }
      if (ids.length === 0) return true;
      const has = await this.hasAnyContractPermissionUseCase.execute(
        userId,
        ids,
      );
      if (!has) throw AppError.forbidden('Sem permissão para os contratos');
      return true;
    }

    if (options.mode === 'all') {
      const ids = this.toNumberArray(value);
      if (ids == null || ids.length === 0) {
        throw AppError.forbidden(
          `Parâmetro '${options.paramName}' deve conter IDs válidos`,
        );
      }
      const userContractsInfo =
        await this.getUserContractsUseCase.execute(userId);
      const allowedContracts = new Set(userContractsInfo.contracts);
      for (const id of ids) {
        if (!allowedContracts.has(id)) {
          throw AppError.forbidden(`Sem permissão para o contrato ${id}`);
        }
      }
      return true;
    }

    return true;
  }

  private extractParam(
    request: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    },
    options: ContractPermissionOptions,
  ): unknown {
    if (request.params?.[options.paramName] != null)
      return request.params[options.paramName];
    if (request.query?.[options.paramName] != null)
      return request.query[options.paramName];
    if (options.bodyPath) {
      const parts = options.bodyPath.split('.');
      let v: unknown = request.body;
      for (const p of parts) {
        v =
          v && typeof v === 'object' && p in v
            ? (v as Record<string, unknown>)[p]
            : undefined;
      }
      return v;
    }
    return undefined;
  }

  private toNumber(v: unknown): number {
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!/^\d+$/.test(trimmed)) return Number.NaN;
      const parsed = Number(trimmed);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
    }
    return Number.NaN;
  }

  private toNumberArray(v: unknown): number[] | null {
    if (Array.isArray(v)) {
      const parsed = v.map((x) => this.toNumber(x));
      if (parsed.some((n) => Number.isNaN(n))) return null;
      return parsed;
    }
    if (typeof v === 'string' && v.includes(',')) {
      const parts = v.split(',').map((x) => x.trim());
      if (parts.some((p) => p.length === 0)) return null;
      const parsed = parts.map((x) => this.toNumber(x));
      if (parsed.some((n) => Number.isNaN(n))) return null;
      return parsed;
    }
    const n = this.toNumber(v);
    if (Number.isNaN(n)) return null;
    return [n];
  }
}
