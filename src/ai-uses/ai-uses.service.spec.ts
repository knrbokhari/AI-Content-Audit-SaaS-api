import { Test, TestingModule } from '@nestjs/testing';
import { AiUsesService } from './ai-uses.service';

describe('AiUsesService', () => {
  let service: AiUsesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiUsesService],
    }).compile();

    service = module.get<AiUsesService>(AiUsesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
