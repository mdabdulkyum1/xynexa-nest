import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);

  constructor() {
    this.logger.log('Core service initialized');
  }

  getAppInfo() {
    return {
      name: 'Xynexa API',
      version: '1.0.0',
      description:
        'NestJS starter template with JWT authentication and WebSocket support',
      author: 'Xynexa Team',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  formatResponse(data: any, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  formatError(message: string, error?: any) {
    return {
      success: false,
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    };
  }
}
