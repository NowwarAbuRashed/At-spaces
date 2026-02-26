import { SetMetadata } from '@nestjs/common';

/**
 * Tells the WebhookSignatureGuard which payment provider's
 * validation logic to invoke on this route.
 * 
 * Usage: @WebhookProvider('apple_pay')
 */
export const WEBHOOK_PROVIDER_KEY = 'webhook_provider';
export const WebhookProvider = (provider: 'apple_pay' | 'visa' | 'mastercard') =>
    SetMetadata(WEBHOOK_PROVIDER_KEY, provider);
