import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'El celular debe tener 10 dígitos' })
  celular: string;

  @IsString()
  @Length(4, 4, { message: 'El PIN debe tener 4 dígitos' })
  @Matches(/^[0-9]{4}$/, { message: 'El PIN solo puede contener números' })
  pin: string;
}