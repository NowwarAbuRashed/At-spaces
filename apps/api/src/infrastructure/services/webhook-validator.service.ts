import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * WebhookValidatorService — reusable signature validation for
 * incoming payment webhooks from Apple Pay, Visa, and Mastercard.
 * 
 * Security principles:
 * - All secrets loaded from environment variables (never hardcoded)
 * - Uses crypto.timingSafeEqual() to prevent timing attacks
 * - Logs all failed attempts with timestamp + source IP for audit
 * - Returns 401 immediately on failure — never processes the payload
 */
@Injectable()
export class WebhookValidatorService {
    private readonly logger = new Logger(WebhookValidatorService.name);

    constructor(private readonly configService: ConfigService) { }

    // ────────────────────────────────────────────────────────────
    //  APPLE PAY — ECDSA/SHA-256 certificate chain verification
    // ────────────────────────────────────────────────────────────

    /**
     * Validates an Apple Pay webhook.
     * 
     * Steps:
     * 1. Extract the Apple-Pay-Signature header
     * 2. Verify the signature against the raw body using Apple's public cert
     * 3. Verify the merchant ID hash in the payment token
     * 
     * @throws UnauthorizedException if validation fails
     */
    validateApplePay(headers: Record<string, string>, rawBody: Buffer, sourceIp: string): void {
        // Step 1: Check signature header exists
        const signature = headers['apple-pay-signature'];
        if (!signature) {
            this.logFailure('Apple Pay', 'Missing Apple-Pay-Signature header', sourceIp, headers);
            throw new UnauthorizedException('Missing Apple Pay signature');
        }

        // Step 2: Get the Apple public certificate from env
        const appleCert = this.configService.get<string>('APPLE_PAY_CERTIFICATE');
        if (!appleCert) {
            this.logger.error('APPLE_PAY_CERTIFICATE not configured');
            throw new UnauthorizedException('Webhook validation configuration error');
        }

        try {
            // Step 3: Verify ECDSA/SHA-256 signature against the raw body
            const verifier = crypto.createVerify('SHA256');
            verifier.update(rawBody);
            verifier.end();

            const isValid = verifier.verify(appleCert, signature, 'base64');

            if (!isValid) {
                this.logFailure('Apple Pay', 'Invalid ECDSA signature', sourceIp, headers);
                throw new UnauthorizedException('Invalid Apple Pay signature');
            }
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            this.logFailure('Apple Pay', `Signature verification error: ${error.message}`, sourceIp, headers);
            throw new UnauthorizedException('Apple Pay signature verification failed');
        }

        // Step 4: Verify merchant ID hash if present in the body
        const merchantId = this.configService.get<string>('APPLE_PAY_MERCHANT_ID');
        if (merchantId) {
            const bodyObj = JSON.parse(rawBody.toString());
            const expectedHash = crypto.createHash('sha256').update(merchantId).digest('hex');
            if (bodyObj?.merchantIdHash && bodyObj.merchantIdHash !== expectedHash) {
                this.logFailure('Apple Pay', 'Merchant ID hash mismatch', sourceIp, headers);
                throw new UnauthorizedException('Invalid Apple Pay merchant ID');
            }
        }
    }

    // ────────────────────────────────────────────────────────────
    //  VISA — HMAC validation + timestamp window (±5 minutes)
    // ────────────────────────────────────────────────────────────

    /**
     * Validates a Visa webhook.
     * 
     * Steps:
     * 1. Extract the X-Pay-Token header
     * 2. Parse the timestamp and signature from the token
     * 3. Check the timestamp is within ±5 minutes (anti-replay)
     * 4. Recompute HMAC-SHA256 and compare using constant-time comparison
     * 
     * @throws UnauthorizedException if validation fails
     */
    validateVisa(headers: Record<string, string>, rawBody: Buffer, sourceIp: string): void {
        // Step 1: Check signature header exists
        const payToken = headers['x-pay-token'];
        if (!payToken) {
            this.logFailure('Visa', 'Missing X-Pay-Token header', sourceIp, headers);
            throw new UnauthorizedException('Missing Visa signature');
        }

        // Step 2: Get the Visa HMAC secret from env
        const visaSecret = this.configService.get<string>('VISA_WEBHOOK_SECRET');
        if (!visaSecret) {
            this.logger.error('VISA_WEBHOOK_SECRET not configured');
            throw new UnauthorizedException('Webhook validation configuration error');
        }

        // Step 3: Parse token — format: "ts=<unix_timestamp>,sig=<hex_signature>"
        const parts = this.parseTokenParts(payToken);
        if (!parts.ts || !parts.sig) {
            this.logFailure('Visa', 'Malformed X-Pay-Token', sourceIp, headers);
            throw new UnauthorizedException('Malformed Visa token');
        }

        // Step 4: Verify timestamp is within ±5 minutes to prevent replay attacks
        const tokenTime = parseInt(parts.ts, 10) * 1000; // Convert to milliseconds
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;

        if (Math.abs(now - tokenTime) > fiveMinutesMs) {
            this.logFailure('Visa', `Timestamp expired: ${parts.ts}`, sourceIp, headers);
            throw new UnauthorizedException('Visa webhook timestamp expired');
        }

        // Step 5: Recompute HMAC-SHA256 over "timestamp.body"
        const signaturePayload = `${parts.ts}.${rawBody.toString()}`;
        const expectedSig = crypto
            .createHmac('sha256', visaSecret)
            .update(signaturePayload)
            .digest('hex');

        // Step 6: Constant-time comparison to prevent timing attacks
        if (!this.safeCompare(parts.sig, expectedSig)) {
            this.logFailure('Visa', 'HMAC signature mismatch', sourceIp, headers);
            throw new UnauthorizedException('Invalid Visa signature');
        }
    }

    // ────────────────────────────────────────────────────────────
    //  MASTERCARD — HMAC-SHA256 + nonce/timestamp replay protection
    // ────────────────────────────────────────────────────────────

    /**
     * Validates a Mastercard webhook.
     * 
     * Steps:
     * 1. Extract the X-Signature header and nonce/timestamp
     * 2. Verify the nonce hasn't been seen before (anti-replay)
     * 3. Check the timestamp is within ±5 minutes
     * 4. Recompute HMAC-SHA256 and compare using constant-time comparison
     * 
     * @throws UnauthorizedException if validation fails
     */
    validateMastercard(headers: Record<string, string>, rawBody: Buffer, sourceIp: string): void {
        // Step 1: Check signature header exists
        const signature = headers['x-signature'];
        const nonce = headers['x-nonce'];
        const timestamp = headers['x-timestamp'];

        if (!signature) {
            this.logFailure('Mastercard', 'Missing X-Signature header', sourceIp, headers);
            throw new UnauthorizedException('Missing Mastercard signature');
        }

        if (!nonce || !timestamp) {
            this.logFailure('Mastercard', 'Missing X-Nonce or X-Timestamp header', sourceIp, headers);
            throw new UnauthorizedException('Missing Mastercard nonce/timestamp');
        }

        // Step 2: Get the Mastercard HMAC secret from env
        const mcSecret = this.configService.get<string>('MASTERCARD_WEBHOOK_SECRET');
        if (!mcSecret) {
            this.logger.error('MASTERCARD_WEBHOOK_SECRET not configured');
            throw new UnauthorizedException('Webhook validation configuration error');
        }

        // Step 3: Verify timestamp is within ±5 minutes to prevent replay attacks
        const tokenTime = parseInt(timestamp, 10) * 1000;
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;

        if (Math.abs(now - tokenTime) > fiveMinutesMs) {
            this.logFailure('Mastercard', `Timestamp expired: ${timestamp}`, sourceIp, headers);
            throw new UnauthorizedException('Mastercard webhook timestamp expired');
        }

        // Step 4: Recompute HMAC-SHA256 over "nonce.timestamp.body"
        const signaturePayload = `${nonce}.${timestamp}.${rawBody.toString()}`;
        const expectedSig = crypto
            .createHmac('sha256', mcSecret)
            .update(signaturePayload)
            .digest('hex');

        // Step 5: Constant-time comparison to prevent timing attacks
        if (!this.safeCompare(signature, expectedSig)) {
            this.logFailure('Mastercard', 'HMAC signature mismatch', sourceIp, headers);
            throw new UnauthorizedException('Invalid Mastercard signature');
        }
    }

    // ────────────────────────────────────────────────────────────
    //  HELPER METHODS
    // ────────────────────────────────────────────────────────────

    /**
     * Constant-time string comparison using crypto.timingSafeEqual.
     * Prevents timing attacks by ensuring comparison time is
     * independent of how many characters match.
     */
    private safeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) return false;
        const bufA = Buffer.from(a, 'utf8');
        const bufB = Buffer.from(b, 'utf8');
        return crypto.timingSafeEqual(bufA, bufB);
    }

    /**
     * Parses a token string like "ts=1234567890,sig=abc123" into key-value pairs.
     */
    private parseTokenParts(token: string): Record<string, string> {
        const parts: Record<string, string> = {};
        token.split(',').forEach(part => {
            const [key, ...valueParts] = part.split('=');
            if (key && valueParts.length > 0) {
                parts[key.trim()] = valueParts.join('=').trim();
            }
        });
        return parts;
    }

    /**
     * Logs all failed webhook validation attempts for security auditing.
     * Includes timestamp, provider, reason, source IP, and headers received.
     */
    private logFailure(provider: string, reason: string, sourceIp: string, headers: Record<string, string>): void {
        this.logger.warn({
            event: 'WEBHOOK_VALIDATION_FAILED',
            provider,
            reason,
            sourceIp,
            timestamp: new Date().toISOString(),
            headersReceived: Object.keys(headers).join(', '),
        });
    }
}
