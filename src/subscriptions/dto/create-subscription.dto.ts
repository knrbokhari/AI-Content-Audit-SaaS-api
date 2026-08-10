export class CreateSubscriptionDto {
  organizationId!: number;
  paymentMethodId!: string;
  priceId?: string;
}
