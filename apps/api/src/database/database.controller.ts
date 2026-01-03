import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { DatabaseService } from './database.service';

@Controller('db')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.databaseService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('tests')
  async findAllTests() {
    return await this.databaseService.findAllTests();
  }

  @Post('tests')
  async createTest(@Body() body: { name: string }) {
    return await this.databaseService.createTest(body.name);
  }

  @Put('tests/:id')
  async updateTest(@Param('id') id: string, @Body() body: { name: string }) {
    return await this.databaseService.updateTest(parseInt(id, 10), body.name);
  }

  @Delete('tests/:id')
  async deleteTest(@Param('id') id: string) {
    return await this.databaseService.deleteTest(parseInt(id, 10));
  }
}
