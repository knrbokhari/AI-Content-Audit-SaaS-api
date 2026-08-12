/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { Prisma } from 'src/generated/prisma/client';
import { paginate } from 'src/common/pagination/paginate';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        id: dto.organizationId,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subscription = await this.prisma.subscriptions.findFirst({
      where: {
        organizationId: organization.id,
      },
    });

    const stripe = await this.getStripe();

    if (subscription?.stripeSubscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      if (
        ['active', 'trialing', 'past_due'].includes(stripeSubscription.status)
      ) {
        throw new BadRequestException(
          'Organization already has an active subscription',
        );
      }
    }

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        metadata: {
          organizationId: organization.id.toString(),
        },
      });

      customerId = customer.id;
    }

    const paymentGateway: any = await this.prisma.paymentGateway.findFirst();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: dto.priceId,
          quantity: 1,
        },
      ],
      success_url: paymentGateway.paymentSuccessUrl,
      cancel_url: paymentGateway.paymentCancelUrl,
      billing_address_collection: 'auto',
      metadata: {
        organizationId: organization.id.toString(),
        userId: user.id.toString(),
      },
    });

    if (subscription) {
      await this.prisma.subscriptions.update({
        where: {
          id: subscription.id,
        },
        data: {
          stripeCustomerId: customerId,
        },
      });
    } else {
      await this.prisma.subscriptions.create({
        data: {
          organizationId: organization.id,
          stripeCustomerId: customerId,
          type: 'paid',
        },
      });
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async findAll({
    limit,
    page,
    search,
    sortedBy,
    orderBy,
    isAdmin,
  }: PaginationQueries) {
    try {
      const perPage = Number(limit) || 10;
      const pageNumber = Number(page) || 1;
      const parseSearchParams = search?.split(';') || [];
      const whereClause: Prisma.SubscriptionsWhereInput = {};
      let orderByClause: Prisma.SubscriptionsOrderByWithRelationInput = {};

      if (parseSearchParams?.length > 0) {
        const organizationIdQuery = parseSearchParams.find((param) =>
          param.startsWith('organizationId:'),
        );

        if (organizationIdQuery) {
          const id = organizationIdQuery.split(':')[1];
          whereClause.organizationId = Number(id);
        }
      }

      if (sortedBy && orderBy) {
        orderByClause = { [orderBy]: sortedBy };
      }

      const result = await this.prisma.subscriptions.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: perPage,
        skip: (pageNumber - 1) * perPage,
        // select: {},
      });

      const totalCount = await this.prisma.subscriptions.count({
        where: whereClause,
      });
      const url = `/subscriptions?search=${search}&limit=${limit}`;
      let adminReport = {};
      if (isAdmin) adminReport = this.simpleAdminReport();

      return {
        data: result,
        ...(isAdmin && adminReport),
        ...paginate(totalCount, page, limit, result.length, url),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching subscriptions.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const subscription = await this.prisma.subscriptions.findUnique({
        where: { id },
        include: {
          invoices: true,
          paymentMethod: true,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      return subscription;

      // if (subscription.stripeSubscriptionId) {
      //   const stripe = await this.getStripe();

      //   const stripeSub = await stripe.subscriptions.retrieve(
      //     subscription.stripeSubscriptionId,
      //     {
      //       expand: [
      //         'default_payment_method',
      //         'latest_invoice',
      //         'items.data.price.product',
      //       ],
      //     },
      //   );
      //   const updated = await this.syncStripeSubscription(
      //     stripe,
      //     stripeSub,
      //     subscription,
      //   );
      //   const org = await this.prisma.organization.findUnique({
      //     where: { id: subscription.organizationId },
      //     select: { name: true },
      //   });
      //   return this.sanitizeSubscription(
      //     {
      //       ...subscription.toObject(),
      //       ...updated,
      //       toObject: () => ({ ...subscription.toObject(), ...updated }),
      //     },
      //     org,
      //   );
      // }

      // const org = await this.prisma.organization.findUnique({
      //   where: { id: subscription.organizationId },
      //   select: { name: true },
      // });
      // return this.sanitizeSubscription(subscription, org);
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching the subscription.',
      );
    }
  }

  async getStripePublishableKey() {
    const paymentGateway = await this.prisma.paymentGateway.findFirst();
    return paymentGateway?.stripePublishableKey;
  }

  async cancelSubscription(id: number) {
    try {
      const doc = await this.prisma.subscriptions.findUnique({
        where: { id },
      });
      if (!doc) throw new NotFoundException('Subscription not found');
      if (!doc.stripeSubscriptionId)
        throw new BadRequestException('No active Stripe subscription');

      const stripe = await this.getStripe();

      await stripe.subscriptions.update(doc.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await this.prisma.subscriptions.update({
        where: { id },
        data: {
          cancelAtPeriodEnd: true,
          status: 'canceled',
        },
      });

      return { success: true };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while updating the subscription.',
      );
    }
  }

  async simpleAdminReport() {
    try {
      const [
        totalSubscription,
        activeSubscriptions,
        monthlyRecurring,
        pastDue,
        activePlans,
      ] = await Promise.all([
        // Total subscriptions
        this.prisma.subscriptions.count(),

        // Active subscriptions
        this.prisma.subscriptions.count({
          where: {
            status: 'active',
          },
        }),

        // Monthly recurring subscriptions
        this.prisma.subscriptions.count({
          where: {
            status: 'active',
            interval: 'monthly',
          },
        }),

        // Past due subscriptions
        this.prisma.subscriptions.count({
          where: {
            status: 'past_due',
          },
        }),

        // Number of unique active plans
        this.prisma.subscriptions.groupBy({
          by: ['stripePriceId'],
          where: {
            status: 'active',
            stripePriceId: {
              not: null,
            },
          },
        }),
      ]);

      return {
        total_subscription: totalSubscription,
        active_subscriptions: activeSubscriptions,
        monthly_recurring: monthlyRecurring,
        past_due: pastDue,
        active_plans: activePlans.length,
      };
    } catch (error) {
      console.error('Failed to generate admin report:', error);

      throw new InternalServerErrorException('Failed to generate admin report');
    }
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

  sanitizeSubscription(doc: any, org: any) {
    return {
      id: doc._id.toString(),
      organizationId: doc.organizationId.toString(),
      partnerOrgId: doc.partnerOrgId?.toString() || null,
      orgName: org?.name || '',
      stripeCustomerId: doc.stripeCustomerId,
      stripeSubscriptionId: doc.stripeSubscriptionId,
      planName: doc.planName || '',
      planId: doc.stripePriceId || '',
      status: doc.status,
      amount: doc.amount,
      currency: doc.currency,
      interval: doc.interval,
      currentPeriodStart: doc.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: doc.currentPeriodEnd?.toISOString() || null,
      nextBillingDate: doc.cancelAtPeriodEnd
        ? null
        : doc.currentPeriodEnd?.toISOString() || null,
      trialEnd: doc.trialEnd?.toISOString() || null,
      cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
      paymentMethod: doc.paymentMethod || null,
      invoices: doc.invoices || [],
      customerId: doc._id.toString(),
    };
  }

  async syncStripeSubscription(stripe, stripeSub, dbDoc) {
    const price = stripeSub.items.data[0]?.price;

    let paymentMethod: any = null;
    if (stripeSub.default_payment_method) {
      const pm =
        typeof stripeSub.default_payment_method === 'string'
          ? await stripe.paymentMethods.retrieve(
              stripeSub.default_payment_method,
            )
          : stripeSub.default_payment_method;
      if (pm?.card) {
        paymentMethod = {
          stripePaymentMethodId: pm.id,
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    }

    const invoiceList = await stripe.invoices.list({
      subscription: stripeSub.id,
      limit: 10,
    });
    const invoices = invoiceList.data.map(this.sanitizeInvoice.bind(this));

    const update = {
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: price?.id || dbDoc.stripePriceId,
      planName: price?.nickname || price?.product?.name || dbDoc.planName,
      status: stripeSub.status,
      amount: price ? price.unit_amount / 100 : dbDoc.amount,
      currency: price?.currency || dbDoc.currency,
      interval: price?.recurring?.interval || dbDoc.interval,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      trialEnd: stripeSub.trial_end
        ? new Date(stripeSub.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      paymentMethod,
      invoices,
    };

    // await SubscriptionModel.updateOne({ _id: dbDoc._id }, { $set: update });

    return { ...dbDoc.toObject(), ...update };
  }

  sanitizeInvoice(inv) {
    return {
      id: inv.id,
      stripeInvoiceId: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      pdf: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    };
  }
}
