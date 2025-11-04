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

    // Health check com timeout para não travar a requisição
    // Se o banco demorar mais de 2s, considera como erro mas retorna resposta
    try {
      const dbCheckPromise = this.databaseService.getPrisma().$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database check timeout')), 2000);
      });

      await Promise.race([dbCheckPromise, timeoutPromise]);
      checks.services.database.status = 'ok';
    } catch (e) {
      // Não importa o erro - marca como erro mas retorna resposta rapidamente
      checks.services.database.status = 'error';
      checks.status = 'degraded';
    }

    return checks;
  }
}


