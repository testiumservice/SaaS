import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AgendarCitaDto } from './dto/agendar-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { fechaColombia } from '../common/zona-horaria';

@Injectable()
export class CitaService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Calcula negocio_id, hora_fin y costo_total en el servidor —
   * nunca se confía en esos valores si vinieran del cliente.
   */
  private async prepararDatosCita(dto: AgendarCitaDto) {
    const { data: empleado, error: errorEmpleado } = await this.supabase
      .getClient()
      .from('empleado')
      .select('id, negocio_id')
      .eq('id', dto.empleadoId)
      .maybeSingle();
    if (errorEmpleado) throw errorEmpleado;
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const { data: asignados, error: errorAsignados } = await this.supabase
      .getClient()
      .from('empleado_servicio')
      .select('servicio_id')
      .eq('empleado_id', dto.empleadoId)
      .in('servicio_id', dto.servicioIds);
    if (errorAsignados) throw errorAsignados;

    if (!asignados || asignados.length !== dto.servicioIds.length) {
      throw new BadRequestException('El empleado no realiza uno o más de los servicios seleccionados');
    }

    const { data: servicios, error: errorServicios } = await this.supabase
      .getClient()
      .from('servicio')
      .select('id, duracion_min, precio')
      .eq('negocio_id', empleado.negocio_id)
      .in('id', dto.servicioIds);
    if (errorServicios) throw errorServicios;
    if (!servicios || servicios.length !== dto.servicioIds.length) {
      throw new BadRequestException('Uno o más servicios no existen en este negocio');
    }

    const duracionTotalMin = servicios.reduce((acc, s) => acc + s.duracion_min, 0);
    const costoTotal = servicios.reduce((acc, s) => acc + Number(s.precio), 0);

    const horaInicio = new Date(dto.horaInicio);
    if (isNaN(horaInicio.getTime())) throw new BadRequestException('horaInicio inválida');
    const horaFin = new Date(horaInicio.getTime() + duracionTotalMin * 60 * 1000);

    return {
      negocioId: empleado.negocio_id,
      horaInicio: horaInicio.toISOString(),
      horaFin: horaFin.toISOString(),
      costoTotal,
      fecha: fechaColombia(horaInicio),
    };
  }

  async agendar(clienteId: string, dto: AgendarCitaDto) {
    const { negocioId, horaInicio, horaFin, costoTotal, fecha } = await this.prepararDatosCita(dto);

    const { data, error } = await this.supabase.getClient().rpc('agendar_cita', {
      p_cliente_id: clienteId,
      p_negocio_id: negocioId,
      p_empleado_id: dto.empleadoId,
      p_servicio_ids: dto.servicioIds,
      p_fecha: fecha,
      p_hora_inicio: horaInicio,
      p_hora_fin: horaFin,
      p_costo_total: costoTotal,
    });

    this.manejarErrorRpc(error);
    return { id: data };
  }

  async reprogramar(clienteId: string, citaAnteriorId: string, dto: ReprogramarCitaDto) {
    await this.verificarPropiedad(clienteId, citaAnteriorId);

    const { negocioId, horaInicio, horaFin, costoTotal, fecha } = await this.prepararDatosCita(dto);

    const { data, error } = await this.supabase.getClient().rpc('reprogramar_cita', {
      p_cita_anterior_id: citaAnteriorId,
      p_cliente_id: clienteId,
      p_negocio_id: negocioId,
      p_empleado_id: dto.empleadoId,
      p_servicio_ids: dto.servicioIds,
      p_fecha: fecha,
      p_hora_inicio: horaInicio,
      p_hora_fin: horaFin,
      p_costo_total: costoTotal,
    });

    this.manejarErrorRpc(error);
    return { id: data };
  }

  async cancelar(clienteId: string, citaId: string) {
    await this.verificarPropiedad(clienteId, citaId);

    const { error } = await this.supabase
      .getClient()
      .from('cita')
      .update({ estado: 'cancelada' })
      .eq('id', citaId);
    if (error) throw error;

    return { ok: true };
  }

  async obtenerDetalle(clienteId: string, citaId: string) {
    return this.verificarPropiedad(clienteId, citaId);
  }

  async obtenerActiva(clienteId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cita')
      .select(`
        *,
        empleado ( nombre ),
        cita_servicio ( servicio ( nombre, duracion_min, precio ) )
      `)
      .eq('cliente_id', clienteId)
      .eq('estado', 'agendada')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  private async verificarPropiedad(clienteId: string, citaId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cita')
      .select(`
        *,
        empleado ( nombre ),
        cita_servicio ( servicio ( nombre, duracion_min, precio ) )
      `)
      .eq('id', citaId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Cita no encontrada');
    if (data.cliente_id !== clienteId) throw new ForbiddenException();
    return data;
  }

  private manejarErrorRpc(error: any) {
    if (!error) return;
    if (error.message?.includes('HORARIO_NO_DISPONIBLE')) {
      throw new ConflictException('Ese horario ya no está disponible');
    }
    if (error.message?.includes('CLIENTE_YA_TIENE_CITA_ACTIVA')) {
      throw new ConflictException('Ya tienes una cita activa');
    }
    throw error;
  }
}