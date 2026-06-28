import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailTemplates } from './templates/email.templates';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = `"ContentPilot AI" <${this.config.getOrThrow<string>('MAIL_FROM')}>`;

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: this.config.get<boolean>('MAIL_SECURE', false),
      auth: {
        user: this.config.getOrThrow<string>('MAIL_USER'),
        pass: this.config.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerifyEmail(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.verifyEmail(name, code);
    await this.send(to, subject, html);
  }

  async sendResendOtp(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.resendOtp(name, code);
    await this.send(to, subject, html);
  }

  async sendForgotPassword(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.forgotPassword(name, code);
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
