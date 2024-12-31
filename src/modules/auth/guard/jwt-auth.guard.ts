import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../decorators";
import { JwtPayload } from "../interfaces";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(
    err: Error | null,
    user: JwtPayload | null,
    info: any,
    context: ExecutionContext,
  ): any {
    if (err || !user) {
      const message =
        info?.name === "TokenExpiredError"
          ? "Token has expired"
          : info?.message || "Invalid token";

      this.logger.warn(`Unauthorized access attempt: ${message}`);

      // Extract the request path from the ExecutionContext
      const request = context.switchToHttp().getRequest();
      const path = request.url;

      // Throw an UnauthorizedException with a structure matching ErrorResponse
      throw new UnauthorizedException({
        statusCode: 401,
        message,
        error: "Unauthorized",
        timestamp: new Date().toISOString(),
        path,
      });
    }
    return user;
  }
}
