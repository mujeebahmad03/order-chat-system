import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { ValidationError } from "class-validator";

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const errorMessages = this.flattenValidationErrors(exception);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: errorMessages,
      error: "Validation Error",
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
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
}
