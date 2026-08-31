import { IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  stripePublishableKey!: string;
  @IsString()
  stripeSecretKey!: string;
  @IsString()
  stripeWebhookSecret!: string;
  @IsString()
  paymentCancelUrl!: string;
  @IsString()
  paymentSuccessUrl!: string;
  @IsString()
  @IsOptional()
  stripeMode?: string;
  @IsString()
  @IsOptional()
  currency?: string;
}
