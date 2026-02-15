import { Module } from '@nestjs/common';
import { OnlineController } from './online.controller';
import { OnlineService } from './online.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [OnlineController],
  providers: [OnlineService],
})
export class OnlineModule {}
