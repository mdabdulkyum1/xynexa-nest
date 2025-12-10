import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MessageService } from './message.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
} from './dto/message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get(':userId')
  async getUserMessages(
    @Param('userId') userId: string,
  ): Promise<MessageResponseDto[]> {
    return this.messageService.getUserMessages(userId);
  }

  @Put(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messageService.updateMessage(id, updateMessageDto);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string): Promise<{ message: string }> {
    return this.messageService.deleteMessage(id);
  }
}
