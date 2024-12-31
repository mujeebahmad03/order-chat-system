import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { WebSocket } from "ws";

@Catch()
export class WebSocketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as WebSocket;
    const request = host.switchToWs().getData();

    let message = "WebSocket error occurred";
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      message = exception.message;
      statusCode = exception.getStatus();
    }

    // Log the exception
    this.logException(exception, request, statusCode);

    const errorMessage = {
      event: "error",
      data: {
        statusCode,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    client.send(JSON.stringify(errorMessage));
  }

  private logException(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    if (exception instanceof HttpException) {
      this.logger.error(
        `WebSocket HTTP Exception: ${exception.message}`,
        exception.stack,
        {
          request: request,
          statusCode,
          timestamp: new Date().toISOString(),
        },
      );
    } else if (exception instanceof Error) {
      this.logger.error(
        `WebSocket Unexpected Error: ${exception.message}`,
        exception.stack,
        {
          request: request,
          statusCode,
          timestamp: new Date().toISOString(),
        },
      );
    } else {
      this.logger.error(
        `WebSocket Unknown Exception: ${JSON.stringify(exception)}`,
        {
          request: request,
          statusCode,
          timestamp: new Date().toISOString(),
        },
      );
    }
  }
}
