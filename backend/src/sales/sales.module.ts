import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [ClinicsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
