import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the exception
    this.logException(exception, request);

    const errorResponse = {
      statusCode: status,
      message:
        typeof exceptionResponse === "object"
          ? (exceptionResponse as any).message
          : exceptionResponse,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private logException(exception: HttpException, request: Request): void {
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === "object"
        ? (exceptionResponse as any).message
        : exceptionResponse;

    this.logger.error(
      `HTTP Exception: ${exception.name} - ${message}`,
      exception.stack,
      {
        path: request.url,
        method: request.method,
        status: exception.getStatus(),
        timestamp: new Date().toISOString(),
      },
    );
  }
}
