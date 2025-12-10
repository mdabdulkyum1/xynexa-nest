import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsObject()
  @IsNotEmpty()
  payload!: any;
}

export class WebhookResponseDto {
  id!: string;
  event!: string;
  payload!: any;
  processed!: boolean;
  createdAt!: Date;
}
