import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  GoneException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  ServiceUnavailableException,
  HttpException,
} from "@nestjs/common";

@Injectable()
export class ExceptionHelperService {
  throwBadRequestException(message: string, path?: string): never {
    throw new BadRequestException({
      statusCode: 400,
      message,
      error: "Bad Request",
      timestamp: new Date().toISOString(),
      path,
    });
  }

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

  throwConflictException(message: string, path?: string): never {
    throw new ConflictException({
      statusCode: 409,
      message,
      error: "Conflict",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwGoneException(message: string, path?: string): never {
    throw new GoneException({
      statusCode: 410,
      message,
      error: "Gone",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwPayloadTooLargeException(message: string, path?: string): never {
    throw new PayloadTooLargeException({
      statusCode: 413,
      message,
      error: "Payload Too Large",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwUnsupportedMediaTypeException(message: string, path?: string): never {
    throw new UnsupportedMediaTypeException({
      statusCode: 415,
      message,
      error: "Unsupported Media Type",
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

  throwServiceUnavailableException(message: string, path?: string): never {
    throw new ServiceUnavailableException({
      statusCode: 503,
      message,
      error: "Service Unavailable",
      timestamp: new Date().toISOString(),
      path,
    });
  }

  throwHttpException(
    statusCode: number,
    message: string,
    error: string,
    path?: string,
  ): never {
    throw new HttpException(
      {
        statusCode,
        message,
        error,
        timestamp: new Date().toISOString(),
        path,
      },
      statusCode,
    );
  }
}
