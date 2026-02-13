/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface EmailTemplate {
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesPath: string;

  constructor(private configService: ConfigService) {
    this.templatesPath = path.join(
      process.cwd(),
      'src/modules/email/templates',
    );
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailSender = this.configService.get('email.emailSender');

      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: emailSender.name,
            email: emailSender.email,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text || this.stripHtml(options.html),
        },
        {
          headers: {
            'api-key': emailSender.app_pass,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Email sent successfully to ${options.to} via Brevo API`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `💥 Brevo Email API Error for ${options.to}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }

  async sendTemplateEmail(
    to: string,
    templateData: EmailTemplate,
  ): Promise<boolean> {
    try {
      const html = await this.renderTemplate(
        templateData.template,
        templateData.data,
      );

      return this.sendEmail({
        to,
        subject: templateData.subject,
        html,
        text: this.stripHtml(html),
      });
    } catch (error) {
      this.logger.error(`Failed to send template email:`, error);
      return false;
    }
  }

  private async renderTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string> {
    try {
      // Load base template
      const baseTemplatePath = path.join(this.templatesPath, 'base.hbs');
      const baseTemplate = await fs.promises.readFile(baseTemplatePath, 'utf8');

      // Load specific content template
      const contentTemplatePath = path.join(
        this.templatesPath,
        `${templateName}.hbs`,
      );
      const contentTemplate = await fs.promises.readFile(
        contentTemplatePath,
        'utf8',
      );

      // Compile templates
      const baseCompiled = handlebars.compile(baseTemplate);
      const contentCompiled = handlebars.compile(contentTemplate);

      // Render content template
      const content = contentCompiled(data);

      // Merge with base template
      const finalData = {
        ...data,
        content,
        appName: 'Xynexa',
        appUrl: 'https://xynexa.com',
        supportEmail: 'support@xynexa.com',
        year: new Date().getFullYear(),
      };

      return baseCompiled(finalData);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendOTPEmail(
    to: string,
    otp: string,
    type: 'verification' | 'password_reset' = 'verification',
  ): Promise<boolean> {
    const userName = to.split('@')[0]; // Simple name extraction
    const expiryMinutes = this.configService.get<number>(
      'email.otp.expiryMinutes',
    );

    const templates = {
      verification: {
        subject: 'Verify Your Email - Xynexa',
        template: 'otp-verification',
      },
      password_reset: {
        subject: 'Password Reset Code - Xynexa',
        template: 'password-reset',
      },
    };

    const templateConfig = templates[type];

    return this.sendTemplateEmail(to, {
      subject: templateConfig.subject,
      template: templateConfig.template,
      data: {
        userName,
        otp,
        expiryMinutes,
      },
    });
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    return this.sendTemplateEmail(to, {
      subject: 'Welcome to Xynexa! 🎉',
      template: 'welcome',
      data: {
        userName,
        loginUrl: 'https://xynexa.com/login',
      },
    });
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      const emailSender = this.configService.get('email.emailSender');
      return !!emailSender.app_pass;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }
}
