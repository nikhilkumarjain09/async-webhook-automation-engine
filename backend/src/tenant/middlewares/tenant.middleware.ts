import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';
import { TenantRequest } from '../interfaces/tenant.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const apiKeyHeader = req.headers['x-api-key'] as string || req.query.apiKey as string || req.query.api_key as string;

    if (tenantId) {
      // Validate ObjectId format to prevent Mongoose CastError (500 error)
      if (!/^[0-9a-fA-F]{24}$/.test(tenantId)) {
        throw new BadRequestException('Invalid X-Tenant-ID format');
      }

      try {
        const tenant = await this.tenantService.findByIdWithApiKey(tenantId);
        
        if (tenant.status !== 'active') {
          throw new ForbiddenException(`Tenant '${tenant.name}' is suspended or deleted`);
        }

        // Check if the current request is webhook ingestion (which uses signature verification instead of apiKey header verification)
        const isWebhookIngestion = req.method === 'POST' && req.path.match(/\/api\/webhooks\/[a-zA-Z0-9_]+$/) && !req.path.endsWith('/replay');

        if (!isWebhookIngestion) {
          if (!apiKeyHeader || apiKeyHeader !== tenant.apiKey) {
            throw new UnauthorizedException('Missing or invalid X-API-Key authorization');
          }
        }

        req.tenant = tenant;
        req.tenantId = tenantId;
      } catch (error) {
        if (error instanceof ForbiddenException || error instanceof UnauthorizedException || error instanceof BadRequestException) {
          throw error;
        }
        throw new UnauthorizedException(`Tenant authentication failed`);
      }
    }

    next();
  }
}
