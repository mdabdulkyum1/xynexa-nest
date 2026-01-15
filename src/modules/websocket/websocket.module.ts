import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { HmsMeetGateway } from './hms-meet.gateway';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [UserModule, MessageModule, BoardModule],
  providers: [WebsocketGateway, HmsMeetGateway],
})
export class WebsocketModule {}
