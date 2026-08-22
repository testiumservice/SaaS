
import { IsEmail, IsString } from 'class-validator';

export class LoginAdminDto {
  @IsEmail()
  correo!: string;

  @IsString()
  password!: string;
}