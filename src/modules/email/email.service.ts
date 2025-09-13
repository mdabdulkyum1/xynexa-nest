/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as sendgrid from '@sendgrid/mail';

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
  private transporter: nodemailer.Transporter;
  private readonly templatesPath: string;

  constructor(private configService: ConfigService) {
    this.templatesPath = path.join(process.cwd(), 'src/modules/email/templates');
    this.initializeEmailProvider();
  }

  private initializeEmailProvider() {
    const provider = this.configService.get<string>('email.provider');

    if (provider === 'sendgrid') {
      const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
      if (apiKey) {
        sendgrid.setApiKey(apiKey);
        this.logger.log('SendGrid email provider initialized');
      } else {
        this.logger.warn('SendGrid API key not provided, falling back to SMTP');
        this.initializeSMTP();
      }
    } else {
      this.initializeSMTP();
    }
  }

  private initializeSMTP() {
    const smtpConfig = this.configService.get('email.smtp');
    
    this.transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    });

    this.logger.log('SMTP email provider initialized');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = this.configService.get('email.from');
      const provider = this.configService.get<string>('email.provider');

      if (provider === 'sendgrid') {
        await sendgrid.send({
          to: options.to,
          from: `${from.name} <${from.address}>`,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
      } else {
        await this.transporter.sendMail({
          from: `${from.name} <${from.address}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
      }

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendTemplateEmail(to: string, templateData: EmailTemplate): Promise<boolean> {
    try {
      const html = await this.renderTemplate(templateData.template, templateData.data);
      
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

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      // Load base template
      const baseTemplatePath = path.join(this.templatesPath, 'base.hbs');
      const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');
      
      // Load specific content template
      const contentTemplatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const contentTemplate = fs.readFileSync(contentTemplatePath, 'utf8');
      
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
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async sendOTPEmail(to: string, otp: string, type: 'verification' | 'password_reset' = 'verification'): Promise<boolean> {
    const userName = to.split('@')[0]; // Simple name extraction
    const expiryMinutes = this.configService.get<number>('email.otp.expiryMinutes');

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
      const provider = this.configService.get<string>('email.provider');
      
      if (provider === 'sendgrid') {
        // SendGrid doesn't have a verify method, so we'll just check if API key is set
        const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
        return !!apiKey;
      } else {
        if (this.transporter) {
          await this.transporter.verify();
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }
}
