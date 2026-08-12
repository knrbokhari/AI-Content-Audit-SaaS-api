import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  AdminSubscriptionsController,
  SubscriptionsController,
} from './subscriptions.controller';

@Module({
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
