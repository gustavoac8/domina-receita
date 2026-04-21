import { Global, Module } from '@nestjs/common';
import { MetaService } from './meta/meta.service';
import { MetaController } from './meta/meta.controller';
import { GoogleAdsService } from './google/google-ads.service';
import { GoogleBusinessService } from './google/google-business.service';
import { GoogleController } from './google/google.controller';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappController } from './whatsapp/whatsapp.controller';

@Global()
@Module({
  controllers: [MetaController, GoogleController, WhatsappController],
  providers: [
    MetaService,
    GoogleAdsService,
    GoogleBusinessService,
    WhatsappService,
  ],
  exports: [
    MetaService,
    GoogleAdsService,
    GoogleBusinessService,
    WhatsappService,
  ],
})
export class IntegrationsModule {}
