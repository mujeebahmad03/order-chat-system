import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ValidationError } from "class-validator";
import { Request } from "express";

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const errorMessages = this.flattenValidationErrors(exception);

    // Log the validation errors
    this.logValidationErrors(exception, request);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: errorMessages,
      error: "Validation Error",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private flattenValidationErrors(errors: ValidationError[]): string[] {
    return errors.reduce((acc, error) => {
      if (error.constraints) {
        acc.push(...Object.values(error.constraints));
      }
      if (error.children?.length) {
        acc.push(...this.flattenValidationErrors(error.children));
      }
      return acc;
    }, [] as string[]);
  }

  private logValidationErrors(
    errors: ValidationError[],
    request: Request,
  ): void {
    const errorMessages = this.flattenValidationErrors(errors);

    this.logger.error(`Validation Errors: ${errorMessages.join(", ")}`, null, {
      path: request.url,
      method: request.method,
      status: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
    });
  }
}
