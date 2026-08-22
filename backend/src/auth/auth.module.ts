import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TurnstileService } from './turnstile/turnstile.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET as string,
    signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as import('ms').StringValue },
  }),
}),
  ],
  controllers: [AuthController],
  providers: [AuthService, TurnstileService, JwtStrategy],
})
export class AuthModule {}