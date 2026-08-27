export interface Cliente {
  id: string;
  celular: string;
  primerNombre: string;
  primerApellido: string;
  correo?: string | null;
}

export interface Empleado {
  id: string;
  negocio_id: string;
  nombre: string;
}

export interface Servicio {
  id: string;
  negocio_id: string;
  nombre: string;
  duracion_min: number;
  precio: number;
}

export interface SlotDisponible {
  horaInicio: string; // ISO datetime
  horaFin: string; // ISO datetime
}

export interface Cita {
  id: string;
  cliente_id: string;
  negocio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'agendada' | 'cancelada' | 'completada' | 'no-show';
  costo_total: number;
  servicios?: Servicio[];
}