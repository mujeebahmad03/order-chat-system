import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";

@Injectable()
export class ExceptionHelperService {
  throwUnauthorizedException(message: string, path?: string): never {
    throw new UnauthorizedException({
      statusCode: 401,
      message,
      error: "Unauthorized",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwForbiddenException(message: string, path?: string): never {
    throw new ForbiddenException({
      statusCode: 403,
      message,
      error: "Forbidden",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwNotFoundException(message: string, path?: string): never {
    throw new NotFoundException({
      statusCode: 404,
      message,
      error: "Not Found",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwInternalServerErrorException(message: string, path?: string): never {
    throw new InternalServerErrorException({
      statusCode: 500,
      message,
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
