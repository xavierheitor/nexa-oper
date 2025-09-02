import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DbService } from './db.service';

@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.dbService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('tests')
  async findAllTests() {
    return await this.dbService.findAllTests();
  }

  @Post('tests')
  async createTest(@Body() body: { name: string }) {
    return await this.dbService.createTest(body.name);
  }

  @Put('tests/:id')
  async updateTest(@Param('id') id: string, @Body() body: { name: string }) {
    return await this.dbService.updateTest(parseInt(id, 10), body.name);
  }

  @Delete('tests/:id')
  async deleteTest(@Param('id') id: string) {
    return await this.dbService.deleteTest(parseInt(id, 10));
  }
}
