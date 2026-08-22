import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { SupabaseService } from '../supabase/supabase.service';



// empleado/empleado.service.ts
@Injectable()
export class EmpleadoService {
  constructor(private supabase: SupabaseService) {}

  async create(negocioId: string, dto: CreateEmpleadoDto) {
    const { data, error } = await this.supabase.getClient()
      .from('empleado').insert({ negocio_id: negocioId, nombre: dto.nombre }).select().single();
    if (error) throw error;
    return data;
  }

  async findAll(negocioId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('empleado').select('*').eq('negocio_id', negocioId);
    if (error) throw error;
    return data;
  }

  private async verificarPertenencia(negocioId: string, empleadoId: string) {
    const { data } = await this.supabase.getClient()
      .from('empleado').select('negocio_id').eq('id', empleadoId).maybeSingle();
    if (!data) throw new NotFoundException('Empleado no encontrado');
    if (data.negocio_id !== negocioId) throw new ForbiddenException();
  }

  async update(negocioId: string, empleadoId: string, dto: UpdateEmpleadoDto) {
    await this.verificarPertenencia(negocioId, empleadoId);
    const { data, error } = await this.supabase.getClient()
      .from('empleado').update(dto).eq('id', empleadoId).select().single();
    if (error) throw error;
    return data;
  }

  async remove(negocioId: string, empleadoId: string) {
    await this.verificarPertenencia(negocioId, empleadoId);
    const { error } = await this.supabase.getClient().from('empleado').delete().eq('id', empleadoId);
    if (error) throw error;
    return { ok: true };
  }

  async asignarServicios(negocioId: string, empleadoId: string, servicioIds: string[]) {
  await this.verificarPertenencia(negocioId, empleadoId);

  const { data: servicios, error: errorServicios } = await this.supabase
    .getClient()
    .from('servicio')
    .select('id')
    .eq('negocio_id', negocioId)
    .in('id', servicioIds);
  if (errorServicios) throw errorServicios;
  if (!servicios || servicios.length !== servicioIds.length) {
    throw new BadRequestException('Uno o más servicios no pertenecen a este negocio');
  }

  const { error: errorDelete } = await this.supabase
    .getClient()
    .from('empleado_servicio')
    .delete()
    .eq('empleado_id', empleadoId);
  if (errorDelete) throw errorDelete;

  const filas = servicioIds.map((servicioId) => ({ empleado_id: empleadoId, servicio_id: servicioId }));
  const { error: errorInsert } = await this.supabase.getClient().from('empleado_servicio').insert(filas);
  if (errorInsert) throw errorInsert;

  return { ok: true };
}
}
