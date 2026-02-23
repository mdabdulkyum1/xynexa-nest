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
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
} from './dto/message.dto';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    console.log('MessageController received:', createMessageDto);
    const message = await this.messageService.createMessage(createMessageDto);

    // Notify receiver via socket
    // Ensure we are passing the FULL message object which includes the generated ID
    this.websocketGateway.notifyMessageCreated(message);

    return message;
  }

  @Get(':contactId')
  async getUserMessages(
    @Param('contactId') contactId: string,
    @Query('senderId') senderId: string,
  ): Promise<MessageResponseDto[]> {
    return this.messageService.getUserMessages(senderId, contactId);
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
