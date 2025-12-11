/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
} from './dto/message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  createMessage(
    _createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Message creation not implemented yet');
  }

  getUserMessages(_userId: string): Promise<MessageResponseDto[]> {
    // Implementation will be added later
    throw new NotImplementedException('Get user messages not implemented yet');
  }

  updateMessage(
    _id: string,
    _updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Message update not implemented yet');
  }

  deleteMessage(_id: string): Promise<{ message: string }> {
    // Implementation will be added later
    throw new NotImplementedException('Message deletion not implemented yet');
  }

  async create(payload: {
    senderId: string;
    receiverId: string;
    text: string;
    read: boolean;
  }) {
    return this.prisma.message.create({
      data: {
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        text: payload.text,
        read: payload.read,
      },
    });
  }

  async markRead(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        read: true, // Use the property directly
      },
    });
  }

  // async createGroupMessage(data: any) {
  //   return this.prisma.groupMessage.create({ data });
  // }
}
