import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

interface ResponseData {
  message?: string;
}

@Injectable()
export class TransformInterceptor<T extends ResponseData>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: T) => ({
        data,
        statusCode: response.statusCode,
        message: data.message || 'Success',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
