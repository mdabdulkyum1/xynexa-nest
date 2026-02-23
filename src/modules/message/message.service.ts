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

  async createMessage(
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.create({
      data: {
        senderId: createMessageDto.senderId,
        receiverId: createMessageDto.receiverId,
        content: createMessageDto.content,
        read: false,
      },
    });

    return message as MessageResponseDto;
  }

  async getUserMessages(
    userId: string,
    otherUserId: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages as MessageResponseDto[];
  }

  async updateMessage(
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.update({
      where: { id },
      data: {
        content: updateMessageDto.content,
      },
    });

    return message as MessageResponseDto;
  }

  async deleteMessage(id: string): Promise<{ message: string }> {
    await this.prisma.message.delete({
      where: { id },
    });

    return { message: 'Message deleted successfully' };
  }

  async create(payload: {
    senderId: string;
    receiverId: string;
    content: string;
    read: boolean;
  }) {
    return this.prisma.message.create({
      data: {
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        read: payload.read,
      },
    });
  }

  async markRead(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
      },
    });
  }

  // async createGroupMessage(data: any) {
  //   return this.prisma.groupMessage.create({ data });
  // }
}
