import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { headers, body, query, url, method, params } = context
      .switchToHttp()
      .getRequest<Request>();
    // simple clean up
    const mHeaders = { ...headers };
    const mBody = { ...body };
    delete mHeaders.authorization;
    delete mBody.password;
    delete mBody.newPassword;
    this.logger.warn(
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
    );
    console.log('URL -->', `${method} ${url}`);
    console.log('headers -->', mHeaders);
    query && console.log('params -->', params);
    mBody && console.log('body -->', mBody);
    query && console.log('query -->', query);

    return next.handle();
  }
}
