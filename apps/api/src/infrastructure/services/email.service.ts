import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService } from '../../application/interfaces/external/email-service.interface';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements IEmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        const smtpEmail = this.configService.get<string>('SMTP_EMAIL');
        const smtpPassword = this.configService.get<string>('SMTP_APP_PASSWORD');

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpEmail,
                pass: smtpPassword,
            },
        });
    }

    async send(to: string, subject: string, body: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"At Spaces" <${this.configService.get('SMTP_EMAIL')}>`,
                to,
                subject,
                text: body,
            });
            this.logger.log(`Email sent to ${to} - Subject: ${subject}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
        }
    }
}
