import { WebhookValidatorService } from './webhook-validator.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('WebhookValidatorService', () => {
    let service: WebhookValidatorService;
    let configService: ConfigService;

    const VISA_SECRET = 'test-visa-secret';
    const MC_SECRET = 'test-mc-secret';

    beforeEach(() => {
        configService = {
            get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                    VISA_WEBHOOK_SECRET: VISA_SECRET,
                    MASTERCARD_WEBHOOK_SECRET: MC_SECRET,
                    APPLE_PAY_CERTIFICATE: '',
                    APPLE_PAY_MERCHANT_ID: 'merchant.test',
                };
                return config[key];
            }),
        } as any;

        service = new WebhookValidatorService(configService);
    });

    // ─── VISA TESTS ───────────────────────────────────────────

    describe('Visa Webhook Validation', () => {
        function createValidVisaHeaders(body: string): Record<string, string> {
            const ts = Math.floor(Date.now() / 1000).toString();
            const sig = crypto.createHmac('sha256', VISA_SECRET).update(`${ts}.${body}`).digest('hex');
            return { 'x-pay-token': `ts=${ts},sig=${sig}` };
        }

        it('should accept valid Visa signature ✅', () => {
            const body = JSON.stringify({ transactionId: 'tx-001', status: 'completed' });
            const headers = createValidVisaHeaders(body);
            expect(() => service.validateVisa(headers, Buffer.from(body), '127.0.0.1')).not.toThrow();
        });

        it('should reject tampered Visa payload ❌', () => {
            const body = JSON.stringify({ transactionId: 'tx-001', status: 'completed' });
            const headers = createValidVisaHeaders(body);
            const tamperedBody = JSON.stringify({ transactionId: 'tx-001', status: 'refunded' });
            expect(() => service.validateVisa(headers, Buffer.from(tamperedBody), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });

        it('should reject expired Visa timestamp ❌', () => {
            const body = JSON.stringify({ transactionId: 'tx-001' });
            const ts = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
            const sig = crypto.createHmac('sha256', VISA_SECRET).update(`${ts}.${body}`).digest('hex');
            const headers = { 'x-pay-token': `ts=${ts},sig=${sig}` };
            expect(() => service.validateVisa(headers, Buffer.from(body), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });

        it('should reject missing Visa header ❌', () => {
            const body = JSON.stringify({ transactionId: 'tx-001' });
            expect(() => service.validateVisa({}, Buffer.from(body), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });
    });

    // ─── MASTERCARD TESTS ─────────────────────────────────────

    describe('Mastercard Webhook Validation', () => {
        function createValidMCHeaders(body: string): Record<string, string> {
            const nonce = crypto.randomUUID();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const sig = crypto.createHmac('sha256', MC_SECRET)
                .update(`${nonce}.${timestamp}.${body}`)
                .digest('hex');
            return { 'x-signature': sig, 'x-nonce': nonce, 'x-timestamp': timestamp };
        }

        it('should accept valid Mastercard signature ✅', () => {
            const body = JSON.stringify({ transactionId: 'mc-001', amount: 50 });
            const headers = createValidMCHeaders(body);
            expect(() => service.validateMastercard(headers, Buffer.from(body), '127.0.0.1')).not.toThrow();
        });

        it('should reject tampered Mastercard payload ❌', () => {
            const body = JSON.stringify({ transactionId: 'mc-001', amount: 50 });
            const headers = createValidMCHeaders(body);
            const tamperedBody = JSON.stringify({ transactionId: 'mc-001', amount: 999 });
            expect(() => service.validateMastercard(headers, Buffer.from(tamperedBody), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });

        it('should reject expired Mastercard timestamp ❌', () => {
            const body = JSON.stringify({ transactionId: 'mc-001' });
            const nonce = crypto.randomUUID();
            const timestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 min ago
            const sig = crypto.createHmac('sha256', MC_SECRET)
                .update(`${nonce}.${timestamp}.${body}`)
                .digest('hex');
            const headers = { 'x-signature': sig, 'x-nonce': nonce, 'x-timestamp': timestamp };
            expect(() => service.validateMastercard(headers, Buffer.from(body), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });

        it('should reject missing Mastercard header ❌', () => {
            const body = JSON.stringify({ transactionId: 'mc-001' });
            expect(() => service.validateMastercard({}, Buffer.from(body), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });
    });

    // ─── APPLE PAY TESTS ──────────────────────────────────────

    describe('Apple Pay Webhook Validation', () => {
        it('should reject missing Apple-Pay-Signature header ❌', () => {
            const body = JSON.stringify({ merchantIdHash: 'abc' });
            expect(() => service.validateApplePay({}, Buffer.from(body), '127.0.0.1'))
                .toThrow(UnauthorizedException);
        });
    });
});
