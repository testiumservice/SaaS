
import { IsUUID, IsDateString, IsBoolean, IsOptional, Matches } from 'class-validator';

export class SetExcepcionDto {
  @IsUUID()
  empleadoId!: string;

  @IsDateString()
  fecha!: string; // "YYYY-MM-DD"

  @IsBoolean()
  bloqueado!: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido, usa HH:mm' })
  horaInicio?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido, usa HH:mm' })
  horaFin?: string;
}