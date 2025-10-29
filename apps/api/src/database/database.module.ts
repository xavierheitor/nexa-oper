import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { PrismaClient } from '@nexa-oper/db';

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
