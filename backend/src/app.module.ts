import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { NegocioModule } from './negocio/negocio.module';
import { EmpleadoModule } from './empleado/empleado.module';
import { ServicioModule } from './servicio/servicio.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';
import { CitaModule } from './cita/cita.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 segundos
        limit: 20, // límite general por IP, se sobreescribe en rutas específicas como /auth/login
      },
    ]),
    SupabaseModule,
    AuthModule,
    NegocioModule,
    EmpleadoModule,
    ServicioModule,
    DisponibilidadModule,
    CitaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
