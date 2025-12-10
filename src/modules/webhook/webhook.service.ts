/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebhookDto, WebhookResponseDto } from './dto/webhook.dto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  processWebhook(
    _createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Webhook processing not implemented yet');
  }
}
