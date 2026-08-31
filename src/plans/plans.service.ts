/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async createPlan(data: CreatePlanDto) {
    const stripe = await this.getStripe();

    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      metadata: { features: data?.features.join(', ') },
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: data.currency ?? 'usd',
      unit_amount: data.amount * 100,
      recurring: {
        interval: data.interval,
        interval_count: 1,
      },
      expand: ['product'],
    });

    return this.sanitizePlan(price);
  }

  async getPlans() {
    try {
      const stripe = await this.getStripe();

      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
        type: 'recurring',
        limit: 100,
      });

      return prices.data
        .filter(
          (p) =>
            p.product &&
            typeof p.product === 'object' &&
            !p.product.deleted &&
            p.product.active,
        )
        .map((i) => this.sanitizePlan(i))
        .sort((a, b) => a.price - b.price);
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch plans from Stripe',
      );
    }
  }

  async getPlan(priceId: string) {
    const stripe = await this.getStripe();

    const result = stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    return this.sanitizePlan(result);
  }

  async updatePlan(productId: string, data: UpdatePlanDto) {
    try {
      const stripe = await this.getStripe();
      const features = data?.features || [];
      const updatedProduct = await stripe.products.update(productId, {
        name: data.name,
        description: data.description,
        metadata: { features: features.join(', ') },
      });

      return this.sanitizePlan(updatedProduct);
    } catch (error) {
      console.log(error);
    }
  }

  async archivePlan(productId: string) {
    const stripe = await this.getStripe();

    return stripe.products.update(productId, {
      active: false,
    });
  }

  async activatePlan(productId: string) {
    const stripe = await this.getStripe();

    return stripe.products.update(productId, {
      active: true,
    });
  }

  async deleteProduct(productId: string) {
    const stripe = await this.getStripe();

    return stripe.products.del(productId);
  }

  /**
   * Get Stripe Key
   */
  private async getStripe(): Promise<Stripe> {
    const paymentGateway = await this.prisma.paymentGateway.findFirst();

    if (!paymentGateway) {
      throw new NotFoundException('Payment gateway configuration not found');
    }

    return new Stripe(paymentGateway.stripeSecretKey);
  }

  /**
   * Publishable Key
   */
  async getPublishableKey() {
    const paymentGateway = await this.prisma.paymentGateway.findFirst();

    if (!paymentGateway) {
      throw new NotFoundException('Payment gateway configuration not found');
    }

    return paymentGateway.stripePublishableKey;
  }

  private sanitizePlan(price: any) {
    return {
      id: price.id,
      productId:
        typeof price.product === 'object' ? price.product.id : price.product,
      name: typeof price.product === 'object' ? price.product.name : '',
      description:
        typeof price.product === 'object' ? price.product.description : '',
      price: price.unit_amount / 100,
      currency: price.currency,
      interval: price.recurring?.interval || 'month',
      intervalCount: price.recurring?.interval_count || 1,
      active: price.active,
      productActive:
        typeof price.product === 'object' ? price.product.active : true,
      features:
        typeof price.product === 'object' && price.product.metadata?.features
          ? price.product.metadata.features
              .split(',')
              .map((f) => f.trim())
              .filter(Boolean)
          : [],
      trialDays: price.recurring?.trial_period_days || 0,
      metadata: typeof price.product === 'object' ? price.product.metadata : {},
      subscriberCount: 0,
    };
  }
}
