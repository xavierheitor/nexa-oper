import { Module } from '@nestjs/common';

import { WebLogsController } from './web-logs.controller';
import { WebLogsService } from './web-logs.service';

@Module({
  controllers: [WebLogsController],
  providers: [WebLogsService],
})
export class WebLogsModule {}
