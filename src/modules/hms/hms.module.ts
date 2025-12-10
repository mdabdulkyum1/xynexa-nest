import { Module } from '@nestjs/common';
import { HmsController } from './hms.controller';
import { HmsService } from './hms.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [HmsController],
  providers: [HmsService, PrismaService],
  exports: [HmsService],
})
export class HmsModule {}
