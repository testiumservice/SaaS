import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

@Injectable()
export class TurnstileService {
  private readonly verifyUrl =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  async validarToken(token: string, remoteIp?: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Falta el token de verificación anti-bot');
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      throw new InternalServerErrorException(
        'TURNSTILE_SECRET_KEY no está configurada',
      );
    }

    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (remoteIp) {
      body.append('remoteip', remoteIp);
    }

    let data: TurnstileVerifyResponse;
    try {
      const res = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      data = await res.json();
    } catch {
      throw new InternalServerErrorException(
        'No se pudo contactar el servicio anti-bot',
      );
    }

    if (!data.success) {
      throw new BadRequestException('Verificación anti-bot inválida');
    }
  }
}