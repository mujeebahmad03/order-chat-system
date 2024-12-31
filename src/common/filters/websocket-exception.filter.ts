import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class WebSocketExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as WebSocket;

    let message = "WebSocket error occurred";
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      message = exception.message;
      statusCode = exception.getStatus();
    }

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
}
