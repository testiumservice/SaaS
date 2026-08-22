import { IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class AsignarServiciosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  servicioIds!: string[];
}