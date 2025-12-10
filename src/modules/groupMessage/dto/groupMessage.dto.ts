import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsMongoId()
  @IsNotEmpty()
  groupId!: string;

  @IsMongoId()
  @IsNotEmpty()
  senderId!: string;
}

export class UpdateGroupMessageDto {
  @IsString()
  @IsOptional()
  content?: string;
}

export class GroupMessageResponseDto {
  id!: string;
  content!: string;
  groupId!: string;
  senderId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
