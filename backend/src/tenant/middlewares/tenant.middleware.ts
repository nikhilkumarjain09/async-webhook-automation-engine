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

    if (tenantId) {
      // Validate ObjectId format to prevent Mongoose CastError (500 error)
      if (!/^[0-9a-fA-F]{24}$/.test(tenantId)) {
        throw new BadRequestException('Invalid X-Tenant-ID format');
      }

      try {
        const tenant = await this.tenantService.findById(tenantId);
        
        if (tenant.status !== 'active') {
          throw new ForbiddenException(`Tenant '${tenant.name}' is suspended or deleted`);
        }

        req.tenant = tenant;
        req.tenantId = tenantId;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        throw new UnauthorizedException(`Tenant with ID '${tenantId}' not found`);
      }
    }

    next();
  }
}
