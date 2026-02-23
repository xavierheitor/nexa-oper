import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  LoginRequestContract,
  RefreshTokenRequestContract,
  TokenPairContract,
} from '../../../contracts/auth/auth.contract';
import { Public } from '../../../core/auth/public.decorator';
import { LogOperation } from '../../../core/logger/log-operation.decorator';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  /**
   * Realiza o login de um usuário móvel.
   *
   * Valida as credenciais (matrícula e senha) e retorna um par de tokens (access + refresh).
   *
   * @param dto - Dados de login (matrícula e senha).
   * @returns Par de tokens e tempo de expiração.
   */
  @Public()
  @LogOperation({ logOutput: false })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<TokenPairContract> {
    const input: LoginRequestContract = dto;
    return this.loginUseCase.execute(input);
  }

  /**
   * Atualiza o token de acesso usando um refresh token válido.
   *
   * Verifica se o refresh token é válido e não foi revogado, invalida-o e emite um novo par de tokens.
   *
   * @param dto - Objeto contendo o refresh token.
   * @returns Novo par de tokens e tempo de expiração.
   */
  @Public()
  @LogOperation({ logOutput: false })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<TokenPairContract> {
    const input: RefreshTokenRequestContract = dto;
    return this.refreshTokenUseCase.execute(input);
  }
}
