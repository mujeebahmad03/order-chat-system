import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { timeout, catchError } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err.name === "TimeoutError") {
          throw new RequestTimeoutException("Request timeout");
        }
        throw err;
      }),
    );
  }
}
