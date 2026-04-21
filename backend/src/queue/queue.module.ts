import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FollowupWorker } from './followup.worker';
import { RemindersWorker } from './reminders.worker';
import { IntegrationsModule } from '../integrations/integrations.module';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), IntegrationsModule],
  providers: [FollowupWorker, RemindersWorker],
})
export class QueueModule {}
