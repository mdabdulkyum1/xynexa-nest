import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHmsDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class UpdateHmsDto {
  @IsString()
  @IsOptional()
  roomId?: string;
}

export class HmsResponseDto {
  id!: string;
  roomId!: string;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
