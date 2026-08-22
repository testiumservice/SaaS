import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistrarNegocioDto {
  @IsString()
  nombreNegocio!: string;

  @IsString()
  categoria!: string; // 'barberia' | 'unas' | 'pestanas' | 'spa'

  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  password!: string;
}