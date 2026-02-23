import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsMongoId()
  @IsNotEmpty()
  senderId!: string;

  @IsMongoId()
  @IsNotEmpty()
  receiverId!: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  content?: string;
}

export class MessageResponseDto {
  id!: string;
  content!: string;
  senderId!: string;
  receiverId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
