/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { ResourceModule } from './resource/resource.module';
import { PermissionModule } from './permission/permission.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PlansModule } from './plans/plans.module';
import { WebhookModule } from './webhook/webhook.module';
import { SettingsModule } from './settings/settings.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { WebsiteAuditsModule } from './website-audits/website-audits.module';
import { AiModule } from './src/ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BrandingModule } from './branding/branding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    RoleModule,
    ResourceModule,
    PermissionModule,
    PrismaModule,
    SubscriptionsModule,
    PlansModule,
    WebhookModule,
    SettingsModule,
    OrganizationsModule,
    WebsiteAuditsModule,
    AiModule,
    DashboardModule,
    BrandingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
