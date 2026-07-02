import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const delay = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${statusCode} - ${delay}ms - IP: ${ip} - UA: ${userAgent}`,
          );
        },
        error: (error: any) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = error.status || response.statusCode || 500;
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${statusCode} - ${delay}ms - IP: ${ip} - UA: ${userAgent} - Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
