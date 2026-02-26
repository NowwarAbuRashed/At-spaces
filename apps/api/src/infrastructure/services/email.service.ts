import { Injectable } from '@nestjs/common';
import { IEmailService } from '../../application/interfaces/external/email-service.interface';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements IEmailService {
    // private transporter: nodemailer.Transporter;

    constructor(
        // private configService: ConfigService
    ) {
        // this.transporter = nodemailer.createTransport({
        //   host: this.configService.get('SMTP_HOST'),
        //   port: this.configService.get('SMTP_PORT'),
        //   secure: false, // true for 465, false for other ports
        //   auth: {
        //     user: this.configService.get('SMTP_USER'),
        //     pass: this.configService.get('SMTP_PASS'),
        //   },
        // });
    }

    async send(to: string, subject: string, body: string): Promise<void> {
        // try {
        //   await this.transporter.sendMail({
        //     from: '"At Spaces" <noreply@atspaces.com>',
        //     to,
        //     subject,
        //     text: body,
        //   });
        // } catch (error) {
        //   console.error('Error sending email', error);
        // }
        console.log(`[EmailService] Sending email to ${to} - Subject: ${subject}`);
    }
}
