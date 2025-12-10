import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { BoardStatus } from '@prisma/client';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @IsEnum(BoardStatus)
  @IsOptional()
  status?: BoardStatus;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BoardStatus)
  @IsOptional()
  status?: BoardStatus;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}

export class AddMemberToBoardDto {
  @IsMongoId()
  @IsNotEmpty()
  boardId!: string;

  @IsMongoId()
  @IsNotEmpty()
  userId!: string;
}

export class AddCommentToBoardDto {
  @IsMongoId()
  @IsNotEmpty()
  boardId!: string;

  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class AddAttachmentToBoardDto {
  @IsMongoId()
  @IsNotEmpty()
  boardId!: string;

  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  filename!: string;
}

export class UpdateBoardStatusDto {
  @IsEnum(BoardStatus)
  @IsNotEmpty()
  status!: BoardStatus;
}

export class BoardResponseDto {
  id!: string;
  title!: string;
  description?: string;
  teamId!: string;
  status!: BoardStatus;
  targetDate?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  members?: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName?: string;
      email: string;
      imageUrl?: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    url: string;
    filename: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName?: string;
      email: string;
      imageUrl?: string;
    };
  }>;
}

export class BoardSummaryDto {
  overallSummary!: {
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
  };
  teamSummaries!: Array<{
    teamName: string;
    teamId: string;
    totalMembers: number;
    totalTasks: number;
  }>;
}
