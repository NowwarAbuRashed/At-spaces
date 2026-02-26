import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookSignatureGuard } from '../../../common/guards/webhook-signature.guard';
import { WebhookProvider } from '../../../common/decorators/webhook-provider.decorator';

/**
 * Webhook Controller — handles incoming payment event notifications
 * from Apple Pay, Visa, and Mastercard.
 * 
 * Each route is protected by the WebhookSignatureGuard, which
 * validates the provider-specific signature before the handler runs.
 * Failed signatures return 401 immediately — the payload is never processed.
 */
@ApiTags('Webhooks')
@Controller('api/webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    @Post('apple-pay')
    @HttpCode(HttpStatus.OK)
    @UseGuards(WebhookSignatureGuard)
    @WebhookProvider('apple_pay')
    @ApiOperation({ summary: 'Handle Apple Pay payment event webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received and processed' })
    @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
    async handleApplePay(@Body() body: any, @Req() req: any) {
        // Signature already validated by WebhookSignatureGuard
        this.logger.log(`Apple Pay webhook received: ${body.eventType || 'unknown'}`);

        // Process the payment event (update booking payment status, etc.)
        await this.processPaymentEvent('apple_pay', body);

        return { received: true, provider: 'apple_pay' };
    }

    @Post('visa')
    @HttpCode(HttpStatus.OK)
    @UseGuards(WebhookSignatureGuard)
    @WebhookProvider('visa')
    @ApiOperation({ summary: 'Handle Visa payment event webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received and processed' })
    @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
    async handleVisa(@Body() body: any, @Req() req: any) {
        this.logger.log(`Visa webhook received: ${body.eventType || 'unknown'}`);

        await this.processPaymentEvent('visa', body);

        return { received: true, provider: 'visa' };
    }

    @Post('mastercard')
    @HttpCode(HttpStatus.OK)
    @UseGuards(WebhookSignatureGuard)
    @WebhookProvider('mastercard')
    @ApiOperation({ summary: 'Handle Mastercard payment event webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received and processed' })
    @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
    async handleMastercard(@Body() body: any, @Req() req: any) {
        this.logger.log(`Mastercard webhook received: ${body.eventType || 'unknown'}`);

        await this.processPaymentEvent('mastercard', body);

        return { received: true, provider: 'mastercard' };
    }

    /**
     * Core payment event processing logic.
     * In production, this would:
     * 1. Find the booking by transactionId
     * 2. Update payment status (pending → paid/failed)
     * 3. Send confirmation notification to customer
     */
    private async processPaymentEvent(provider: string, payload: any): Promise<void> {
        const transactionId = payload.transactionId || payload.transaction_id;
        const status = payload.status || payload.eventType;

        this.logger.log({
            event: 'PAYMENT_WEBHOOK_PROCESSED',
            provider,
            transactionId,
            status,
            timestamp: new Date().toISOString(),
        });

        // TODO: Wire to BookingService/PaymentService when ready
        // e.g. await this.paymentService.updatePaymentStatus(transactionId, status);
    }
}
