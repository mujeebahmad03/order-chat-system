import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Database error occurred";
    let error = "Internal Server Error";

    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = "A record with this value already exists";
        error = "Conflict";
        break;
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Record not found";
        error = "Not Found";
        break;
      case "P2003":
        status = HttpStatus.BAD_REQUEST;
        message = "Invalid relationship data provided";
        error = "Bad Request";
        break;
      case "P2014":
        status = HttpStatus.BAD_REQUEST;
        message = "Invalid ID provided";
        error = "Invalid Input";
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
