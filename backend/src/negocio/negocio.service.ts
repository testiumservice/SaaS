import { Injectable } from '@nestjs/common';
import { UpdateNegocioDto } from './dto/update-negocio.dto';
import { SupabaseService } from '../supabase/supabase.service';

// negocio/negocio.service.ts
@Injectable()
export class NegocioService {
  constructor(private supabase: SupabaseService) {}

  async findMine(negocioId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('negocio').select('*').eq('id', negocioId).single();
    if (error) throw error;
    return data;
  }

  async updateMine(negocioId: string, dto: UpdateNegocioDto) {
    const { data, error } = await this.supabase.getClient()
      .from('negocio').update(dto).eq('id', negocioId).select().single();
    if (error) throw error;
    return data;
  }
}
