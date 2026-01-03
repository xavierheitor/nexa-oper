import { Module } from '@nestjs/common';
import { PrismaClient } from '@nexa-oper/db';

import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

@Module({
  controllers: [DatabaseController],
  providers: [
    DatabaseService,
    {
      provide: PrismaClient,
      useFactory: (databaseService: DatabaseService) => {
        return databaseService.getPrisma();
      },
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, PrismaClient],
})
export class DatabaseModule {}
