import { IsUUID, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BloqueHorarioDto } from './bloque-horario.dto';

export class SetDisponibilidadDto {
  @IsUUID()
  empleadoId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BloqueHorarioDto)
  bloques!: BloqueHorarioDto[];
}