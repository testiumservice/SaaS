// negocio/dto/update-negocio.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateNegocioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() direccion?: string;
}