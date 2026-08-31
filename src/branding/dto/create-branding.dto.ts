import { IsString } from 'class-validator';

export class CreateBrandingDto {
  @IsString()
  logo?: string;
  @IsString()
  primaryColor?: string;
  @IsString()
  secondaryColor?: string;
  @IsString()
  primaryColorDark?: string;
  @IsString()
  secondaryColorDark?: string;
  @IsString()
  logoUrl?: string;

  organizationId?: number;
}
