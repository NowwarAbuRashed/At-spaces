import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Strategy for Passport.
 * Extracts the Bearer token from the Authorization header,
 * validates it using the secret, and attaches the decoded
 * payload ({ userId, role, email }) to req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            // Extract JWT from Authorization: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // Reject expired tokens automatically
            ignoreExpiration: false,
            // Use the same secret that signed the token
            secretOrKey: configService.get<string>('JWT_SECRET') || 'at-spaces-jwt-secret-change-in-production',
        });
    }

    /**
     * Called after token is verified. The return value is
     * attached to req.user on every authenticated request.
     */
    async validate(payload: { sub: number; role: string; email: string }) {
        return {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
        };
    }
}
