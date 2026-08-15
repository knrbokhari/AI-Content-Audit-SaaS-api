import { Module } from '@nestjs/common';
import { WebsiteAuditsService } from './website-audits.service';
import { WebsiteAuditsController } from './website-audits.controller';
import { AiService } from 'src/src/ai/ai.service';

@Module({
  controllers: [WebsiteAuditsController],
  providers: [WebsiteAuditsService, AiService],
})
export class WebsiteAuditsModule {}
