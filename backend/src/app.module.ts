import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClinicsModule } from './clinics/clinics.module';
import { DiagnosticoModule } from './diagnostico/diagnostico.module';
import { BriefingModule } from './briefing/briefing.module';
import { SitesModule } from './sites/sites.module';
import { CrmModule } from './crm/crm.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { QueueModule } from './queue/queue.module';
import { PlansModule } from './plans/plans.module';
import { SeoModule } from './seo/seo.module';
import { FollowupsModule } from './followups/followups.module';
import { SalesModule } from './sales/sales.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PostsalesModule } from './postsales/postsales.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    IntegrationsModule,
    QueueModule,
    AuthModule,
    UsersModule,
    ClinicsModule,
    DiagnosticoModule,
    BriefingModule,
    SitesModule,
    CrmModule,
    CampaignsModule,
    AnalyticsModule,
    PlansModule,
    SeoModule,
    FollowupsModule,
    SalesModule,
    ReviewsModule,
    PostsalesModule,
    ReferralsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
