import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Req } from '@nestjs/common';
import { AsignarServiciosDto } from './dto/asignar-servicios.dto';

// empleado/empleado.controller.ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_negocio')
@Controller('empleados')
export class EmpleadoController {
  constructor(private empleadoService: EmpleadoService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateEmpleadoDto) {
    return this.empleadoService.create(req.user.negocioId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.empleadoService.findAll(req.user.negocioId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateEmpleadoDto) {
    return this.empleadoService.update(req.user.negocioId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.empleadoService.remove(req.user.negocioId, id);
  }

  @Post(':id/servicios')
  asignarServicios(@Req() req, @Param('id') id: string, @Body() dto: AsignarServiciosDto) {
  return this.empleadoService.asignarServicios(req.user.negocioId, id, dto.servicioIds);
}
}
