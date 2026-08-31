import { IsUrl } from 'class-validator';

export class CreateWebsiteAuditDto {
  @IsUrl()
  url!: string;
}
