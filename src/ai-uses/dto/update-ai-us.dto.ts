import { PartialType } from '@nestjs/mapped-types';
import { CreateAiUsesDto } from './create-ai-us.dto';

export class UpdateAiUsesDto extends PartialType(CreateAiUsesDto) {}
