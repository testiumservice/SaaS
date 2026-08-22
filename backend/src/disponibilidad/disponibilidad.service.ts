import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SetDisponibilidadDto } from './dto/set-disponibilidad.dto';
import { SetExcepcionDto } from './dto/set-excepcion.dto';

const ZONA_HORARIA_OFFSET = '-05:00'; // Colombia, sin horario de verano
const GRANULARIDAD_MIN = 15; // cada cuántos minutos se ofrece un slot candidato

@Injectable()
export class DisponibilidadService {
  constructor(private supabase: SupabaseService) {}

  private async verificarPertenencia(negocioId: string, empleadoId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('empleado')
      .select('id, negocio_id')
      .eq('id', empleadoId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Empleado no encontrado');
    if (data.negocio_id !== negocioId) throw new ForbiddenException();
  }

  async setDisponibilidadSemanal(negocioId: string, dto: SetDisponibilidadDto) {
    await this.verificarPertenencia(negocioId, dto.empleadoId);

    const { error } = await this.supabase.getClient().rpc('set_disponibilidad_semanal', {
      p_empleado_id: dto.empleadoId,
      p_bloques: dto.bloques.map((b) => ({
        dia_semana: b.diaSemana,
        hora_inicio: b.horaInicio,
        hora_fin: b.horaFin,
      })),
    });

    if (error) throw error;
    return { ok: true };
  }

  async setExcepcion(negocioId: string, dto: SetExcepcionDto) {
    await this.verificarPertenencia(negocioId, dto.empleadoId);

    const { data, error } = await this.supabase
      .getClient()
      .from('disponibilidad_excepcion')
      .upsert(
        {
          empleado_id: dto.empleadoId,
          fecha: dto.fecha,
          bloqueado: dto.bloqueado,
          hora_inicio: dto.bloqueado ? null : dto.horaInicio,
          hora_fin: dto.bloqueado ? null : dto.horaFin,
        },
        { onConflict: 'empleado_id,fecha' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async calcularSlots(empleadoId: string, fecha: string, duracionMin: number) {
    if (duracionMin <= 0) throw new BadRequestException('duracionMin inválido');

    const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();

    // 1. ¿Hay una excepción puntual para ese empleado en esa fecha?
    const { data: excepcion, error: errorExcepcion } = await this.supabase
      .getClient()
      .from('disponibilidad_excepcion')
      .select('*')
      .eq('empleado_id', empleadoId)
      .eq('fecha', fecha)
      .maybeSingle();
    if (errorExcepcion) throw errorExcepcion;

    let bloques: { hora_inicio: string; hora_fin: string }[];

    if (excepcion) {
      if (excepcion.bloqueado) return []; // día bloqueado por completo
      bloques = [{ hora_inicio: excepcion.hora_inicio, hora_fin: excepcion.hora_fin }];
    } else {
      // 2. Horario semanal recurrente de ese día
      const { data: disponibilidad, error: errorDisponibilidad } = await this.supabase
        .getClient()
        .from('disponibilidad')
        .select('hora_inicio, hora_fin')
        .eq('empleado_id', empleadoId)
        .eq('dia_semana', diaSemana)
        .eq('bloqueado', false);
      if (errorDisponibilidad) throw errorDisponibilidad;
      if (!disponibilidad || disponibilidad.length === 0) return [];
      bloques = disponibilidad;
    }

    // 3. Citas ya agendadas de ese empleado ese día
    const inicioDia = `${fecha}T00:00:00${ZONA_HORARIA_OFFSET}`;
    const finDia = `${fecha}T23:59:59${ZONA_HORARIA_OFFSET}`;

    const { data: citas, error: errorCitas } = await this.supabase
      .getClient()
      .from('cita')
      .select('hora_inicio, hora_fin')
      .eq('empleado_id', empleadoId)
      .eq('estado', 'agendada')
      .gte('hora_inicio', inicioDia)
      .lte('hora_inicio', finDia);
    if (errorCitas) throw errorCitas;

    const ocupados = (citas ?? []).map((c) => ({
      inicio: new Date(c.hora_inicio).getTime(),
      fin: new Date(c.hora_fin).getTime(),
    }));

    // 4. Generar slots candidatos por cada bloque disponible, descartando los que se solapan
    const duracionMs = duracionMin * 60 * 1000;
    const slots: string[] = [];

    for (const bloque of bloques) {
      const inicioBloque = new Date(`${fecha}T${bloque.hora_inicio}:00${ZONA_HORARIA_OFFSET}`).getTime();
      const finBloque = new Date(`${fecha}T${bloque.hora_fin}:00${ZONA_HORARIA_OFFSET}`).getTime();

      for (
        let inicioSlot = inicioBloque;
        inicioSlot + duracionMs <= finBloque;
        inicioSlot += GRANULARIDAD_MIN * 60 * 1000
      ) {
        const finSlot = inicioSlot + duracionMs;
        const seSolapa = ocupados.some((o) => inicioSlot < o.fin && finSlot > o.inicio);
        if (!seSolapa) slots.push(new Date(inicioSlot).toISOString());
      }
    }

    return slots;
  }
}