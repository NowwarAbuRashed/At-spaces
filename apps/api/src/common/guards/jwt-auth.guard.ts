import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard NestJS JWT authentication guard.
 * Apply with @UseGuards(JwtAuthGuard) on any route
 * that requires a valid JWT token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
