import { PartialType } from '@nestjs/mapped-types';
import { CreateWebsiteAuditDto } from './create-website-audit.dto';

export class UpdateWebsiteAuditDto extends PartialType(CreateWebsiteAuditDto) {}
