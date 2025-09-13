import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SendOTPDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOTPDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  otp: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  newPassword: string;
}
