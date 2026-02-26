import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationModule } from './application/application.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Passport with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JWT module with secret from environment
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'at-spaces-jwt-secret-change-in-production',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    ApplicationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // JWT strategy for Passport authentication
    JwtStrategy,
  ],
  exports: [JwtModule, PassportModule],
})
export class AppModule { }
