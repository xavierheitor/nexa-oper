import { Module } from '@nestjs/common';
import { PrismaClient } from '@nexa-oper/db';

import { DatabaseService } from './database.service';

@Module({
  controllers: [],
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
