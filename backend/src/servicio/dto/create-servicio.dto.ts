// servicio/dto/create-servicio.dto.ts
import { IsString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  nombre!: string;

  @IsInt()
  @Min(5, { message: 'La duración mínima es 5 minutos' })
  duracionMin!: number;

  @IsNumber()
  @Min(0)
  precio!: number;
}