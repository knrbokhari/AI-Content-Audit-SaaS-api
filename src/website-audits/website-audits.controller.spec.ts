import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteAuditsController } from './website-audits.controller';
import { WebsiteAuditsService } from './website-audits.service';

describe('WebsiteAuditsController', () => {
  let controller: WebsiteAuditsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteAuditsController],
      providers: [WebsiteAuditsService],
    }).compile();

    controller = module.get<WebsiteAuditsController>(WebsiteAuditsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
