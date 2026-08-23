import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandingDto } from './create-branding.dto';

export class UpdateBrandingDto extends PartialType(CreateBrandingDto) {}
