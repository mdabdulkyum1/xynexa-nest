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

  createGroupMessage(
    _createGroupMessageDto: CreateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException(
      'Group message creation not implemented yet',
    );
  }

  getGroupMessages(_groupId: string): Promise<GroupMessageResponseDto[]> {
    // Implementation will be added later
    throw new NotImplementedException('Get group messages not implemented yet');
  }

  updateGroupMessage(
    _id: string,
    _updateGroupMessageDto: UpdateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException(
      'Group message update not implemented yet',
    );
  }

  deleteGroupMessage(_id: string): Promise<{ message: string }> {
    // Implementation will be added later
    throw new NotImplementedException(
      'Group message deletion not implemented yet',
    );
  }
}
