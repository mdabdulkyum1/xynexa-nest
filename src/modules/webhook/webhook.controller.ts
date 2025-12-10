import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto, WebhookResponseDto } from './dto/webhook.dto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async processWebhook(
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.processWebhook(createWebhookDto);
  }
}
