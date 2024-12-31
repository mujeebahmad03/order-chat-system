import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators";
import { RequestWithUser } from "../interfaces";
import { ExceptionHelperService } from "src/common/exceptions";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly exceptionHelper: ExceptionHelperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, path } = request;

    // If no user is present, deny access
    if (!user) {
      this.exceptionHelper.throwForbiddenException("No user found ", path);
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);

    // If the user does not have the required role, deny access
    if (!hasRole) {
      const message = `User with role ${user.role} does not have required role(s): ${requiredRoles.join(
        ", ",
      )}`;
      this.exceptionHelper.throwForbiddenException(message, path);
    }

    return true;
  }
}
