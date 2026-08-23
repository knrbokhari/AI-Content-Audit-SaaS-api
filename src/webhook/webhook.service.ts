/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = await this.getStripe();

    const setting = await this.prisma.paymentGateway.findFirst();

    const webhookSecret: any = setting?.stripeWebhookSecret;
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        this.checkoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await this.subscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.subscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await this.invoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.invoiceFailed(event.data.object);
        break;
    }

    return {
      received: true,
    };
  }

  private checkoutCompleted(session: Stripe.Checkout.Session) {
    console.log(session.id);
  }

  private async subscriptionUpdated(subscription: Stripe.Subscription) {
    const price = subscription.items.data[0].price;
    const stripe = await this.getStripe();

    const result: any = await stripe.prices.retrieve(price.id, {
      expand: ['product'],
    });

    await this.prisma.subscriptions.updateMany({
      where: {
        stripeCustomerId: subscription.customer as string,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        planName: result.product.name,
        status: subscription.status as any,
        amount: (price.unit_amount ?? 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval ?? 'month',
        currentPeriodStart: new Date(
          subscription.items.data[0].current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          subscription.items.data[0].current_period_end * 1000,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    const sub = await this.prisma.subscriptions.findFirst({
      where: {
        stripeCustomerId: subscription.customer as string,
      },
    });

    await this.prisma.user.updateMany({
      where: {
        organizationId: sub?.organizationId,
      },
      data: {
        plan_status: 'active',
        plan_type: 'paid',
        plane: price.id,
      },
    });
  }

  private async subscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscriptions.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'canceled',
      },
    });
  }

  private async invoicePaid(invoice: Stripe.Invoice) {
    const sub = await this.prisma.subscriptions.findFirst({
      where: {
        stripeSubscriptionId: invoice.parent?.subscription_details
          ?.subscription as string,
      },
    });
    console.log(sub, invoice.parent?.subscription_details);
    await this.prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        status: 'paid',
        date: new Date(invoice.created * 1000),
        subscriptionsId: sub?.id || 3,
      },
    });
  }

  private async invoiceFailed(invoice: Stripe.Invoice) {
    await this.prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        status: 'failed',
        date: new Date(invoice.created * 1000),
      },
    });

    await this.prisma.subscriptions.updateMany({
      where: {
        stripeSubscriptionId: invoice.parent?.subscription_details
          ?.subscription as string,
      },
      data: {
        status: 'past_due',
      },
    });
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
}
