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
import { GroupMessageService } from './groupMessage.service';
import {
  CreateGroupMessageDto,
  UpdateGroupMessageDto,
  GroupMessageResponseDto,
} from './dto/groupMessage.dto';

@Controller('group-messages')
export class GroupMessageController {
  constructor(private readonly groupMessageService: GroupMessageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroupMessage(
    @Body() createGroupMessageDto: CreateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    return this.groupMessageService.createGroupMessage(createGroupMessageDto);
  }

  @Get(':groupId')
  async getGroupMessages(
    @Param('groupId') groupId: string,
  ): Promise<GroupMessageResponseDto[]> {
    return this.groupMessageService.getGroupMessages(groupId);
  }

  @Put(':id')
  async updateGroupMessage(
    @Param('id') id: string,
    @Body() updateGroupMessageDto: UpdateGroupMessageDto,
  ): Promise<GroupMessageResponseDto> {
    return this.groupMessageService.updateGroupMessage(
      id,
      updateGroupMessageDto,
    );
  }

  @Delete(':id')
  async deleteGroupMessage(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.groupMessageService.deleteGroupMessage(id);
  }
}
