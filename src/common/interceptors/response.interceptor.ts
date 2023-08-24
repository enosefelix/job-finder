import { API_RESPONSE_META } from '../decorators/response.decorator';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from './interfaces/interceptors.interface';
import { ApiResponseMetaOptions } from '../decorators/interfaces/decorators.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector = new Reflector()) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const responseOptions =
      this.reflector.getAllAndOverride<ApiResponseMetaOptions>(
        API_RESPONSE_META,
        [context.getHandler(), context.getClass()],
      );
    const message = responseOptions?.message;
    if (responseOptions?.statusCode) {
      context.switchToHttp().getResponse().status(responseOptions?.statusCode);
    }

    return next.handle().pipe(
      map((data) => ({
        statusCode: responseOptions?.statusCode,
        message,
        data,
      })),
    );
  }
}
