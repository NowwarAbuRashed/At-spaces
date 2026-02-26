import { Injectable } from '@nestjs/common';
import { ISmsService } from '../../application/interfaces/external/sms-service.interface';
// import { ConfigService } from '@nestjs/config';
// import { Twilio } from 'twilio';

@Injectable()
export class SmsService implements ISmsService {
    // private twilioClient: Twilio;

    constructor(
        // private configService: ConfigService
    ) {
        // const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        // const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        // this.twilioClient = new Twilio(accountSid, authToken);
    }

    async send(to: string, message: string): Promise<void> {
        // try {
        //   await this.twilioClient.messages.create({
        //     body: message,
        //     from: this.configService.get('TWILIO_PHONE_NUMBER'),
        //     to,
        //   });
        // } catch (error) {
        //   console.error('Error sending SMS', error);
        // }
        console.log(`[SmsService] Sending SMS to ${to} - Message: ${message}`);
    }
}
