create table negocio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,               -- 'barberia' | 'unas' | 'pestanas' | 'spa'
  direccion text,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create table empleado (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocio(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table servicio (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocio(id) on delete cascade,
  nombre text not null,
  duracion_min integer not null,
  precio numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table empleado_servicio (
  empleado_id uuid not null references empleado(id) on delete cascade,
  servicio_id uuid not null references servicio(id) on delete cascade,
  primary key (empleado_id, servicio_id)
);

create table cliente (
  id uuid primary key default gen_random_uuid(),
  celular text not null unique,
  pin_hash text not null,
  primer_nombre text not null,
  segundo_nombre text,
  primer_apellido text not null,
  segundo_apellido text,
  correo text,
  created_at timestamptz not null default now()
);

create table cita (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id),
  negocio_id uuid not null references negocio(id),
  empleado_id uuid not null references empleado(id),
  fecha date not null,
  hora_inicio timestamptz not null,
  hora_fin timestamptz not null,
  estado text not null default 'agendada', -- agendada | cancelada | completada | no-show
  costo_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table cita_servicio (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references cita(id) on delete cascade,
  servicio_id uuid not null references servicio(id)
);

create table disponibilidad (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleado(id) on delete cascade,
  dia_semana integer not null,     -- 0 = domingo ... 6 = sábado
  hora_inicio text not null,       -- "09:00"
  hora_fin text not null,          -- "18:00"
  bloqueado boolean not null default false
);

create index on cita (empleado_id, estado);
create index on cita (cliente_id, estado);