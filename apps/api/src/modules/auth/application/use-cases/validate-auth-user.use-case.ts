import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../../domain/ports/auth-session-repository.port';

@Injectable()
export class ValidateAuthUserUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepositoryPort,
  ) {}

  execute(userId: number) {
    return this.sessions.findActiveUserById(userId);
  }
}
