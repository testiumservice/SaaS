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
import { RegistrarNegocioDto } from './dto/registrar-negocio.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
interface RegistrarNegocioResult {
  admin_id: string;
  negocio_id: string;
}@Injectable()
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

  async registrarNegocio(dto: RegistrarNegocioDto) {
  const { data: existente } = await this.supabase
    .getClient()
    .from('negocio_admin')
    .select('id')
    .eq('correo', dto.correo)
    .maybeSingle();

  if (existente) {
    throw new ConflictException('Correo ya registrado');
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);

  const { data, error } = await this.supabase
    .getClient()
    .rpc('registrar_negocio_con_admin', {
      p_nombre_negocio: dto.nombreNegocio,
      p_categoria: dto.categoria,
      p_correo: dto.correo,
      p_password_hash: passwordHash,
    })
    .single();

  if (error) {
    throw new InternalServerErrorException(
      'No se pudo registrar el negocio',
    );
  }

  const resultado = data as RegistrarNegocioResult;

  const payload = {
    sub: resultado.admin_id,
    role: 'admin_negocio',
    negocioId: resultado.negocio_id,
  };

  return {
    access_token: this.jwtService.sign(payload),
  };
}

async loginAdmin(dto: LoginAdminDto) {
  const { data: admin } = await this.supabase.getClient()
    .from('negocio_admin').select('*').eq('correo', dto.correo).maybeSingle();

  if (!admin || !(await bcrypt.compare(dto.password, admin.password_hash))) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  const payload = { sub: admin.id, role: 'admin_negocio', negocioId: admin.negocio_id };
  return { access_token: this.jwtService.sign(payload) };
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
      role: 'cliente',
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