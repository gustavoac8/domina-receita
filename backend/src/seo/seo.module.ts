import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [ClinicsModule],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
