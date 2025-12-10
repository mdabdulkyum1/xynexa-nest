import { Module } from '@nestjs/common';
import { GroupMessageController } from './groupMessage.controller';
import { GroupMessageService } from './groupMessage.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [GroupMessageController],
  providers: [GroupMessageService, PrismaService],
  exports: [GroupMessageService],
})
export class GroupMessageModule {}
