import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NegocioService } from './negocio.service';
import { UpdateNegocioDto } from './dto/update-negocio.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Req } from '@nestjs/common';

// negocio/negocio.controller.ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_negocio')
@Controller('negocios')
export class NegocioController {
  constructor(private negocioService: NegocioService) {}

  @Get('me')
  findMine(@Req() req) {
    return this.negocioService.findMine(req.user.negocioId);
  }

  @Patch('me')
  updateMine(@Req() req, @Body() dto: UpdateNegocioDto) {
    return this.negocioService.updateMine(req.user.negocioId, dto);
  }
}