import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUsuarioMobileId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id ?? request.user?.sub;
  }
);
