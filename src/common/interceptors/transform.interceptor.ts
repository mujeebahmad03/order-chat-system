import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { ApiResponseType } from "../interfaces";

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseType<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseType<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      })),
    );
  }
}
