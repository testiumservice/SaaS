// backend/src/servicio/servicio.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicioService } from './servicio.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_negocio')
@Controller('servicios')
export class ServicioController {
  constructor(private servicioService: ServicioService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateServicioDto) {
    return this.servicioService.create(req.user.negocioId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.servicioService.findAll(req.user.negocioId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.servicioService.findOne(req.user.negocioId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateServicioDto) {
    return this.servicioService.update(req.user.negocioId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.servicioService.remove(req.user.negocioId, id);
  }
}