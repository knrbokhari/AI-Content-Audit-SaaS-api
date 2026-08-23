import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-session')
  create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.subscriptionsService.create(createSubscriptionDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() query: PaginationQueries,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.subscriptionsService.findAll({
      ...query,
      search: `${query.search};organizationId:${user.organizationId}`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('stripe-publishable-key')
  getStripePublishableKey() {
    return this.subscriptionsService.getStripePublishableKey();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(+id);
  }
}

@Controller('admin-subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: PaginationQueries) {
    return this.subscriptionsService.findAll({ ...query, isAdmin: true });
  }
}
