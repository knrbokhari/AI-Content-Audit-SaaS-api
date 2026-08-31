import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Module({
  controllers: [],
  providers: [AiService],
})
export class AiModule {}
