import { Module, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { HmsMeetGateway } from './hms-meet.gateway';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [UserModule, forwardRef(() => MessageModule), BoardModule],
  providers: [WebsocketGateway, HmsMeetGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
