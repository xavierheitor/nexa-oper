import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { UserContractsInfo } from '../decorators/get-user-contracts-info.decorator';
import { GetUserContractsUseCase } from '../application/use-cases/get-user-contracts.use-case';

interface ContractsRequestContext {
  user?: { id?: number; sub?: number };
  userContracts?: number[];
  userContractsInfo?: UserContractsInfo;
}

@Injectable()
export class UserContractsInterceptor implements NestInterceptor {
  constructor(
    private readonly getUserContractsUseCase: GetUserContractsUseCase,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<ContractsRequestContext>();
    const user = request.user;
    const userId = user?.id ?? user?.sub;

    if (userId == null || request.userContractsInfo) {
      return next.handle();
    }

    return from(this.getUserContractsUseCase.execute(userId)).pipe(
      switchMap((result) => {
        request.userContracts = result.contracts;
        request.userContractsInfo = result;
        return next.handle();
      }),
    );
  }
}
