import { Module } from '@nestjs/common';
import { AiUsesService } from './ai-uses.service';
import { AiUsesController } from './ai-uses.controller';

@Module({
  controllers: [AiUsesController],
  providers: [AiUsesService],
})
export class AiUsesModule {}
