import { IsUUID, IsArray, ArrayMinSize, IsISO8601 } from 'class-validator';

export class AgendarCitaDto {
  @IsUUID()
  empleadoId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  servicioIds!: string[];

  @IsISO8601()
  horaInicio!: string; // uno de los slots devueltos por GET /disponibilidad/slots
}