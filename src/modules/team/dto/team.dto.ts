import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsMongoId,
} from 'class-validator';

export enum TeamType {
  TEAMS = 'teams',
  STARTUPS = 'startups',
  BUSINESSES = 'businesses',
  REMOTE_WORKERS = 'remote_workers',
}

// Import TeamType from Prisma
import { TeamType as PrismaTeamType } from '@prisma/client';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  teamName: string;

  @IsString()
  @IsOptional()
  teamDescription?: string;

  @IsEnum(TeamType)
  @IsNotEmpty()
  teamType: PrismaTeamType;

  @IsMongoId()
  @IsNotEmpty()
  creator: string;
}

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TeamType)
  @IsOptional()
  type?: PrismaTeamType;
}

export class AddMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  teamId: string;

  @IsEmail()
  @IsNotEmpty()
  memberEmail: string;
}

export class TeamResponseDto {
  id: string;
  name: string;
  description?: string;
  type: PrismaTeamType;
  creatorId: string;
  createdAt: Date;
  creator?: {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  };
  members?: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  }>;
}

export class FormattedTeamDto {
  title: string;
  url: string;
}
