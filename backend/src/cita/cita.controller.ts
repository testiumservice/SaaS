import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CitaService } from './cita.service';
import { AgendarCitaDto } from './dto/agendar-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('cliente')
@Controller('citas')
export class CitaController {
  constructor(private citaService: CitaService) {}

  @Post()
  agendar(@Req() req, @Body() dto: AgendarCitaDto) {
    return this.citaService.agendar(req.user.userId, dto);
  }

  @Patch(':id/cancelar')
  cancelar(@Req() req, @Param('id') id: string) {
    return this.citaService.cancelar(req.user.userId, id);
  }

  @Post(':id/reprogramar')
  reprogramar(@Req() req, @Param('id') id: string, @Body() dto: ReprogramarCitaDto) {
    return this.citaService.reprogramar(req.user.userId, id, dto);
  }

  @Get('activa')
  obtenerActiva(@Req() req) {
    return this.citaService.obtenerActiva(req.user.userId);
  }

  @Get(':id')
  obtenerDetalle(@Req() req, @Param('id') id: string) {
    return this.citaService.obtenerDetalle(req.user.userId, id);
  }
}