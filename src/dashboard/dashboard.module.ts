import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  AdminDashboardController,
  DashboardController,
} from './dashboard.controller';

@Module({
  controllers: [DashboardController, AdminDashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
