import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import {
  SendOTPDto,
  VerifyOTPDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/email-verification.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService } from '../email/email.service';
import { OTPService, OTPType } from '../email/otp.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly otpService: OTPService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    return {
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // In a real application, you might want to blacklist the token
    return {
      message: 'Logout successful',
    };
  }

  // Email Verification Endpoints
  @Public()
  @Post('send-verification-otp')
  @HttpCode(HttpStatus.OK)
  async sendVerificationOTP(@Body() sendOTPDto: SendOTPDto) {
    const result = await this.otpService.generateAndSendOTP(
      sendOTPDto.email,
      OTPType.EMAIL_VERIFICATION,
    );

    return {
      message: result
        ? 'Verification OTP sent successfully'
        : 'Failed to send OTP. Please try again',
      success: result,
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyOTPDto: VerifyOTPDto) {
    const result = await this.authService.verifyEmail(
      verifyOTPDto.email,
      verifyOTPDto.otp,
    );

    return {
      message: result.success ? 'Email verified successfully' : result.message,
      success: result.success,
    };
  }

  @Public()
  @Post('resend-verification-otp')
  @HttpCode(HttpStatus.OK)
  async resendVerificationOTP(@Body() sendOTPDto: SendOTPDto) {
    const result = await this.otpService.resendOTP(
      sendOTPDto.email,
      OTPType.EMAIL_VERIFICATION,
    );

    return {
      message: result.message,
      success: result.success,
      ...(result.waitTime && { waitTime: result.waitTime }),
    };
  }

  // Password Reset Endpoints
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.otpService.generateAndSendOTP(
      forgotPasswordDto.email,
      OTPType.PASSWORD_RESET,
    );

    return {
      message: result
        ? 'Password reset OTP sent successfully'
        : 'Failed to send OTP. Please try again',
      success: result,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );

    return {
      message: result.success ? 'Password reset successfully' : result.message,
      success: result.success,
    };
  }

  // Test email connection
  @Public()
  @Get('test-email')
  async testEmail() {
    const isConnected = await this.emailService.testEmailConnection();

    return {
      message: isConnected
        ? 'Email service is connected'
        : 'Email service connection failed',
      connected: isConnected,
    };
  }
}
