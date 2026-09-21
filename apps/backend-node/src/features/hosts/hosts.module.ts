import { Module } from '@nestjs/common';

import { PropertiesModule } from '../properties/properties.module';
import { HostRepository } from './host.repository';
import { HostService } from './host.service';
import { HostsController } from './hosts.controller';

@Module({
  imports: [PropertiesModule],
  controllers: [HostsController],
  providers: [HostService, HostRepository],
  exports: [HostService, HostRepository],
})
export class HostsModule {}
