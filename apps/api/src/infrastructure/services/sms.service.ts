import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsService } from '../../application/interfaces/external/sms-service.interface';

@Injectable()
export class SmsService implements ISmsService {
    private readonly logger = new Logger(SmsService.name);
    private twilioClient: any;
    private fromNumber: string | undefined;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

        if (accountSid && authToken) {
            try {
                // Dynamic import to avoid crash if twilio is not installed
                const twilio = require('twilio');
                this.twilioClient = twilio(accountSid, authToken);
                this.logger.log('Twilio client initialized');
            } catch {
                this.logger.warn('Twilio package not installed — SMS will be logged only');
            }
        } else {
            this.logger.warn('Twilio credentials not configured — SMS will be logged only');
        }
    }

    async send(to: string, message: string): Promise<void> {
        if (this.twilioClient) {
            try {
                await this.twilioClient.messages.create({
                    body: message,
                    from: this.fromNumber,
                    to,
                });
                this.logger.log(`SMS sent to ${to}`);
            } catch (error) {
                this.logger.error(`Failed to send SMS to ${to}`, error);
            }
        } else {
            this.logger.log(`[SMS-LOG] To: ${to} — Message: ${message}`);
        }
    }
}
