import { IsUUID, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultarSlotsDto {
  @IsUUID()
  empleadoId!: string;

  @IsDateString()
  fecha!: string;

  @Type(() => Number)
  @IsInt()
  @Min(5, { message: 'duracionMin debe ser al menos 5 minutos' })
  duracionMin!: number;
}
