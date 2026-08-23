import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  paymentMethodId!: string;

  @IsString()
  @IsNotEmpty()
  priceId?: string;
}
