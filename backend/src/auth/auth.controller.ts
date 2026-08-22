import { Body, Controller, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 intentos cada 15 min por IP
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}