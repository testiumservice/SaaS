import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TurnstileService } from './turnstile/turnstile.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly turnstile: TurnstileService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, ip: string) {
    await this.turnstile.validarToken(dto.turnstileToken, ip);

    const { data: existente, error: errorConsulta } = await this.supabase
      .getClient()
      .from('cliente')
      .select('id')
      .eq('celular', dto.celular)
      .maybeSingle();

    if (errorConsulta) {
      throw new InternalServerErrorException('Error validando el celular');
    }

    if (existente) {
      throw new ConflictException('Ese número de celular ya está registrado');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);

    const { data, error } = await this.supabase
      .getClient()
      .from('cliente')
      .insert({
        celular: dto.celular,
        pin_hash: pinHash,
        primer_nombre: dto.primerNombre,
        segundo_nombre: dto.segundoNombre ?? null,
        primer_apellido: dto.primerApellido,
        segundo_apellido: dto.segundoApellido ?? null,
        correo: dto.correo ?? null,
      })
      .select('id, celular, primer_nombre, primer_apellido, correo')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el cliente');
    }

    return data;
  }

  async login(dto: LoginDto) {
    const { data: cliente, error } = await this.supabase
      .getClient()
      .from('cliente')
      .select('id, celular, pin_hash, primer_nombre, primer_apellido')
      .eq('celular', dto.celular)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Error validando credenciales');
    }

    // Mensaje genérico a propósito: no revela si el celular existe o no
    if (!cliente) {
      throw new UnauthorizedException('Celular o PIN incorrectos');
    }

    const pinValido = await bcrypt.compare(dto.pin, cliente.pin_hash);
    if (!pinValido) {
      throw new UnauthorizedException('Celular o PIN incorrectos');
    }

    const payload = {
      sub: cliente.id,
      celular: cliente.celular,
      rol: 'cliente',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      cliente: {
        id: cliente.id,
        celular: cliente.celular,
        primerNombre: cliente.primer_nombre,
        primerApellido: cliente.primer_apellido,
      },
    };
  }
}