import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OnlineService } from './online.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('online')
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users/:userEmail')
  async getOnlineUsers(@Param('userEmail') userEmail: string) {
    return this.onlineService.getOnlineUsers(userEmail);
  }
}
