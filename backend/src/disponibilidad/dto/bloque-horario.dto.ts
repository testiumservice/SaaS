// disponibilidad/dto/bloque-horario.dto.ts
import { IsInt, Max, Min, Matches } from 'class-validator';

export class BloqueHorarioDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana!: number; // 0 = domingo ... 6 = sábado

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido, usa HH:mm' })
  horaInicio!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato de hora inválido, usa HH:mm' })
  horaFin!: string;
}