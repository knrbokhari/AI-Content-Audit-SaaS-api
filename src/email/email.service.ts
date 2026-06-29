import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { emailTemplates } from './templates/email.templates';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = `"ContentPilot AI" <${process.env.SMTP_HOST}>`;

    const transportOptions: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL as string,
        pass: process.env.SMTP_PASSWORD as string,
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendVerifyEmail(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.verifyEmail(name, code);
    await this.send(to, subject, html);
  }

  async sendResendOtp(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.resendOtp(name, code);
    await this.send(to, subject, html);
  }

  async sendForgotPassword(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
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
