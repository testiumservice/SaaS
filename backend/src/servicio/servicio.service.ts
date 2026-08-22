// backend/src/servicio/servicio.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServicioService {
  constructor(private supabase: SupabaseService) {}

  async create(negocioId: string, dto: CreateServicioDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('servicio')
      .insert({
        negocio_id: negocioId,
        nombre: dto.nombre,
        duracion_min: dto.duracionMin,
        precio: dto.precio,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(negocioId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('servicio')
      .select('*')
      .eq('negocio_id', negocioId);

    if (error) throw error;
    return data;
  }

  async findOne(negocioId: string, servicioId: string) {
    const servicio = await this.verificarPertenencia(negocioId, servicioId);
    return servicio;
  }

  async update(negocioId: string, servicioId: string, dto: UpdateServicioDto) {
    await this.verificarPertenencia(negocioId, servicioId);

    const patch: Record<string, any> = {};
    if (dto.nombre !== undefined) patch.nombre = dto.nombre;
    if (dto.duracionMin !== undefined) patch.duracion_min = dto.duracionMin;
    if (dto.precio !== undefined) patch.precio = dto.precio;

    const { data, error } = await this.supabase
      .getClient()
      .from('servicio')
      .update(patch)
      .eq('id', servicioId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(negocioId: string, servicioId: string) {
    await this.verificarPertenencia(negocioId, servicioId);

    const { error } = await this.supabase
      .getClient()
      .from('servicio')
      .delete()
      .eq('id', servicioId);

    if (error) throw error;
    return { ok: true };
  }

  /**
   * Verifica que el servicio exista y pertenezca al negocio del admin autenticado.
   * Evita que un admin edite/borre/consulte servicios de otro negocio adivinando el id.
   */
  private async verificarPertenencia(negocioId: string, servicioId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('servicio')
      .select('*')
      .eq('id', servicioId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Servicio no encontrado');
    if (data.negocio_id !== negocioId) throw new ForbiddenException();

    return data;
  }
}