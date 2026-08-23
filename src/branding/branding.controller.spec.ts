import { Test, TestingModule } from '@nestjs/testing';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';

describe('BrandingController', () => {
  let controller: BrandingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandingController],
      providers: [BrandingService],
    }).compile();

    controller = module.get<BrandingController>(BrandingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
