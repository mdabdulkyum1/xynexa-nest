/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { HashUtil } from '../../common/utils/hash.util';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { OTPService, OTPType } from '../email/otp.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OTPService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await HashUtil.hashPassword(registerDto.password);

    // Create user
    const user = await this.userService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      imageUrl: registerDto.imageUrl,
      role: 'member',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await HashUtil.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && user.password) {
      const isPasswordValid = await HashUtil.comparePassword(
        password,
        user.password,
      );
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async verifyEmail(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message?: string }> {
    // Verify OTP
    const otpResult = await this.otpService.verifyOTP(
      email,
      otp,
      OTPType.EMAIL_VERIFICATION,
    );

    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Update user email verification status
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    await this.userService.update(user.id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Clean up all OTPs for this email and type after successful verification
    await this.otpService.deleteAllByEmail(email, OTPType.EMAIL_VERIFICATION);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, user.firstName || 'User');

    return {
      success: true,
    };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }> {
    // Verify OTP
    const otpResult = await this.otpService.verifyOTP(
      email,
      otp,
      OTPType.PASSWORD_RESET,
    );

    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Find user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Hash new password and update
    const hashedPassword = await HashUtil.hashPassword(newPassword);
    await this.userService.update(user.id, {
      password: hashedPassword,
    });

    // Clean up all OTPs for this email and type after successful password reset
    await this.otpService.deleteAllByEmail(email, OTPType.PASSWORD_RESET);

    return {
      success: true,
    };
  }
}
