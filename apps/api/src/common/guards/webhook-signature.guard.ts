import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WEBHOOK_PROVIDER_KEY } from '../decorators/webhook-provider.decorator';
import { WebhookValidatorService } from '../../infrastructure/services/webhook-validator.service';

/**
 * WebhookSignatureGuard — validates webhook signatures before
 * the request reaches any controller logic.
 * 
 * Reads the @WebhookProvider() metadata to determine which
 * provider's validation to run (Apple Pay, Visa, Mastercard).
 * 
 * Returns HTTP 401 Unauthorized immediately if validation fails.
 * 
 * Usage:
 *   @UseGuards(WebhookSignatureGuard)
 *   @WebhookProvider('visa')
 *   @Post('webhooks/visa')
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly webhookValidator: WebhookValidatorService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Step 1: Determine which provider this route handles
        const provider = this.reflector.getAllAndOverride<string>(WEBHOOK_PROVIDER_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!provider) {
            // No @WebhookProvider decorator — skip validation
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const headers = request.headers;
        const sourceIp = request.ip || request.connection?.remoteAddress || 'unknown';

        // Step 2: Get raw body — NestJS needs rawBody middleware enabled
        const rawBody = request.rawBody || Buffer.from(JSON.stringify(request.body));

        // Step 3: Route to the correct validation method
        switch (provider) {
            case 'apple_pay':
                this.webhookValidator.validateApplePay(headers, rawBody, sourceIp);
                break;
            case 'visa':
                this.webhookValidator.validateVisa(headers, rawBody, sourceIp);
                break;
            case 'mastercard':
                this.webhookValidator.validateMastercard(headers, rawBody, sourceIp);
                break;
            default:
                throw new UnauthorizedException(`Unknown webhook provider: ${provider}`);
        }

        return true;
    }
}
