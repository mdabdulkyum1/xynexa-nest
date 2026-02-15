/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateGroupMessageDto,
  UpdateGroupMessageDto,
  GroupMessageResponseDto,
} from './dto/groupMessage.dto';

@Injectable()
export class GroupMessageService {
  constructor(private prisma: PrismaService) {}

  async createGroupMessage(
    createGroupMessageDto: CreateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    const message = await this.prisma.groupMessage.create({
      data: {
        senderId: createGroupMessageDto.senderId,
        groupId: createGroupMessageDto.groupId,
        content: createGroupMessageDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return message as unknown as GroupMessageResponseDto;
  }

  async getGroupMessages(groupId: string): Promise<GroupMessageResponseDto[]> {
    const messages = await this.prisma.groupMessage.findMany({
      where: {
        groupId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages as unknown as GroupMessageResponseDto[];
  }

  async updateGroupMessage(
    id: string,
    updateGroupMessageDto: UpdateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    const message = await this.prisma.groupMessage.update({
      where: { id },
      data: {
        content: updateGroupMessageDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return message as unknown as GroupMessageResponseDto;
  }

  async deleteGroupMessage(id: string): Promise<{ message: string }> {
    await this.prisma.groupMessage.delete({
      where: { id },
    });

    return { message: 'Group message deleted successfully' };
  }
}
