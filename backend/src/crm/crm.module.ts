import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [ClinicsModule],
  controllers: [CrmController],
  providers: [CrmService],
})
export class CrmModule {}
