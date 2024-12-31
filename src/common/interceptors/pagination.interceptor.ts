import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { PaginatedResponse } from "../interfaces";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class PaginationInterceptor<T>
  implements NestInterceptor<T, PaginatedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        if (!response || !response.items) {
          return response;
        }

        const { items, meta } = response;
        return {
          items,
          meta: {
            ...meta,
            hasNextPage: meta.page < meta.totalPages,
            hasPreviousPage: meta.page > 1,
          },
        };
      }),
    );
  }
}
