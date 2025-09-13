import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { HashUtil } from '../../common/utils/hash.util';

export enum OTPType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN = 'login',
}

@Injectable()
export class OTPService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async generateAndSendOTP(
    email: string,
    type: OTPType,
    userName?: string,
  ): Promise<boolean> {
    // Generate OTP
    const otp = this.generateOTP();
    const hashedOtp = await HashUtil.hashPassword(otp);
    
    // Get expiry time
    const expiryMinutes = this.configService.get<number>('email.otp.expiryMinutes');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Clean up old OTPs for this email and type
    await this.cleanupOldOTPs(email, type);

    // Store OTP in database
    await this.prisma.oTP.create({
      data: {
        email,
        otp: hashedOtp,
        type,
        expiresAt,
      },
    });

    // Send OTP via email
    const emailType = type === OTPType.PASSWORD_RESET ? 'password_reset' : 'verification';
    return this.emailService.sendOTPEmail(email, otp, emailType);
  }

  async verifyOTP(
    email: string,
    otp: string,
    type: OTPType,
  ): Promise<{ valid: boolean; message?: string }> {
    // Find the most recent unused OTP
    const otpRecord = await this.prisma.oTP.findFirst({
      where: {
        email,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return { 
        valid: false, 
        message: 'Invalid or expired OTP' 
      };
    }

    // Check max attempts
    const maxAttempts = this.configService.get<number>('email.otp.maxAttempts');
    if (otpRecord.attempts >= maxAttempts) {
      await this.prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      
      return { 
        valid: false, 
        message: `Too many attempts. Please request a new OTP` 
      };
    }

    // Increment attempts
    await this.prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // Verify OTP
    const isValid = await HashUtil.comparePassword(otp, otpRecord.otp);

    if (isValid) {
      // Mark as used
      await this.prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      return { valid: true };
    }

    return { 
      valid: false, 
      message: `Invalid OTP. ${maxAttempts - otpRecord.attempts - 1} attempts remaining` 
    };
  }

  async resendOTP(
    email: string,
    type: OTPType,
    userName?: string,
  ): Promise<{ success: boolean; message: string; canResend?: boolean; waitTime?: number }> {
    // Check if there's a recent OTP (within 1 minute)
    const recentOTP = await this.prisma.oTP.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gt: new Date(Date.now() - 60 * 1000), // 1 minute ago
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentOTP) {
      const waitTime = 60 - Math.floor((Date.now() - recentOTP.createdAt.getTime()) / 1000);
      return {
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP`,
        canResend: false,
        waitTime,
      };
    }

    // Check how many OTPs have been sent in the last hour
    const recentOTPs = await this.prisma.oTP.count({
      where: {
        email,
        type,
        createdAt: {
          gt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (recentOTPs >= 5) {
      return {
        success: false,
        message: 'Too many OTP requests. Please try again later',
        canResend: false,
      };
    }

    // Generate and send new OTP
    const success = await this.generateAndSendOTP(email, type, userName);
    
    return {
      success,
      message: success 
        ? 'OTP has been sent to your email' 
        : 'Failed to send OTP. Please try again',
      canResend: true,
    };
  }

  private generateOTP(): string {
    const length = this.configService.get<number>('email.otp.length');
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    
    return otp;
  }

  private async cleanupOldOTPs(email: string, type: OTPType): Promise<void> {
    // Mark old unused OTPs as used
    await this.prisma.oTP.updateMany({
      where: {
        email,
        type,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Delete very old OTPs (older than 1 day)
    await this.prisma.oTP.deleteMany({
      where: {
        email,
        type,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  async getOTPStats(email: string): Promise<{
    pendingOTPs: number;
    recentAttempts: number;
    canRequestNew: boolean;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [pendingOTPs, recentAttempts] = await Promise.all([
      this.prisma.oTP.count({
        where: {
          email,
          isUsed: false,
          expiresAt: { gt: now },
        },
      }),
      this.prisma.oTP.count({
        where: {
          email,
          createdAt: { gt: oneHourAgo },
        },
      }),
    ]);

    return {
      pendingOTPs,
      recentAttempts,
      canRequestNew: recentAttempts < 5,
    };
  }
}
