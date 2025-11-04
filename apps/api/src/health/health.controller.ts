import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Public()
  @Get()
  async check() {
    const checks: any = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      status: 'ok',
      services: {
        database: { status: 'unknown' },
        storage: { status: 'ok' },
        queue: { status: 'ok' },
      },
    };

    try {
      await this.databaseService.getPrisma().$queryRaw`SELECT 1`;
      checks.services.database.status = 'ok';
    } catch (e) {
      checks.services.database.status = 'error';
      checks.status = 'degraded';
    }

    return checks;
  }
}


