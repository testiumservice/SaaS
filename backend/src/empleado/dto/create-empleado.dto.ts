// empleado/dto/create-empleado.dto.ts
import { IsString } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  nombre!: string;
}