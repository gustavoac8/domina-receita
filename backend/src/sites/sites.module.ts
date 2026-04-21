import { Module } from '@nestjs/common';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';
import { BriefingModule } from '../briefing/briefing.module';

@Module({
  imports: [BriefingModule],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
