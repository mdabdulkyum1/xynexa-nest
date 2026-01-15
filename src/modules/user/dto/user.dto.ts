import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Role } from '../../../common/decorators/roles.decorator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsDateString()
  @IsOptional()
  emailVerifiedAt?: Date;

  @IsDateString()
  @IsOptional()
  lastLoginAt?: Date;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsDateString()
  @IsOptional()
  emailVerifiedAt?: Date;

  @IsDateString()
  @IsOptional()
  lastLoginAt?: Date;
}
