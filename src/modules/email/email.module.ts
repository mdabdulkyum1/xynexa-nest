import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { OTPService } from './otp.service';
import emailConfig from '../../config/email.config';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [EmailService, OTPService],
  exports: [EmailService, OTPService],
})
export class EmailModule {}
