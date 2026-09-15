import { Test, TestingModule } from '@nestjs/testing';
import { AiUsesController } from './ai-uses.controller';
import { AiUsesService } from './ai-uses.service';

describe('AiUsesController', () => {
  let controller: AiUsesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiUsesController],
      providers: [AiUsesService],
    }).compile();

    controller = module.get<AiUsesController>(AiUsesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
