import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DisponibilidadService } from './disponibilidad.service';
import { SetDisponibilidadDto } from './dto/set-disponibilidad.dto';
import { SetExcepcionDto } from './dto/set-excepcion.dto';
import { ConsultarSlotsDto } from './dto/consultar-slots.dto';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private disponibilidadService: DisponibilidadService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_negocio')
  @Post()
  setDisponibilidad(@Req() req, @Body() dto: SetDisponibilidadDto) {
    return this.disponibilidadService.setDisponibilidadSemanal(req.user.negocioId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_negocio')
  @Post('excepciones')
  setExcepcion(@Req() req, @Body() dto: SetExcepcionDto) {
    return this.disponibilidadService.setExcepcion(req.user.negocioId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('slots')
  getSlots(@Query() query: ConsultarSlotsDto) {
    return this.disponibilidadService.calcularSlots(
      query.empleadoId,
      query.fecha,
      query.duracionMin,
    );
  }
}