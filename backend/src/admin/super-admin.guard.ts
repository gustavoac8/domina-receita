import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * SuperAdminGuard — só permite acesso a usuários com role SUPER_ADMIN ou STAFF.
 * Deve ser aplicado em conjunto com JwtAuthGuard (que popula req.user).
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Não autenticado');
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF') {
      throw new ForbiddenException('Acesso restrito à equipe DominaReceita');
    }
    return true;
  }
}
