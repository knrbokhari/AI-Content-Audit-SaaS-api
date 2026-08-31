import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteAuditsService } from './website-audits.service';

describe('WebsiteAuditsService', () => {
  let service: WebsiteAuditsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsiteAuditsService],
    }).compile();

    service = module.get<WebsiteAuditsService>(WebsiteAuditsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
