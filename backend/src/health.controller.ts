import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  status() {
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
    const masked = dbUrl.replace(/:([^:@]+)@/, ':***@');
    return {
      ok: true,
      service: 'domina-receita-backend',
      timestamp: new Date().toISOString(),
      db_url_masked: masked,
      node_env: process.env.NODE_ENV || 'not_set',
    };
  }

  @Get('db')
  async dbCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1 AS ping`;
      return { ok: true, db: 'connected', timestamp: new Date().toISOString() };
    } catch (err: any) {
      return {
        ok: false,
        db: 'error',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
